import { addDays, daysBetween, displayISO, toISO as formatISO } from "./dates.js?v=8";
import { t as tr, tp } from "./i18n.js?v=8";
import { annualLeaveVestDate, paidStatutoryStart, restDayGaps, isArrangedRestPolicy } from "./rules.js?v=8";

function item(partial) {
  return {
    id: "",
    helperId: "",
    helperName: "",
    type: "",
    title: "",
    body: "",
    date: "",
    urgency: "info",
    ...partial,
  };
}

function urgencyForDays(days) {
  if (days < 0) return "expired";
  if (days <= 7) return "critical";
  if (days <= 30) return "soon";
  if (days <= 90) return "watch";
  return "info";
}

/**
 * Build in-app reminders for a helper. Active window:
 * upcoming items appear 90 days ahead (contract / document expiry),
 * milestone items appear from 14 days before through 30 days after.
 * opts.forHelper writes the text in the second person ("your contract").
 */
export function buildReminders(helper, today, opts = {}) {
  if (!helper) return [];
  const name = helper.name || tr("common.helper");
  const who = opts.forHelper ? tr("rem.you") : name;
  const poss = opts.forHelper ? tr("rem.yourPoss") : tr("rem.possessive", { name });
  const start = helper.startDate || helper.contractStart;
  const end = helper.contractEnd;
  const out = [];

  if (end) {
    const days = daysBetween(today, end);
    const marks = [90, 30, 7];
    for (const mark of marks) {
      if (days <= mark && days >= 0) {
        out.push(
          item({
            id: `${helper.id}:contract-${mark}`,
            helperId: helper.id,
            helperName: name,
            type: "contract",
            title: tp("rem.contract.title", days),
            body: tr("rem.contract.body", { poss, date: displayISO(end) }),
            date: end,
            urgency: urgencyForDays(days),
            mark,
          })
        );
        break;
      }
    }
    if (days < 0 && days >= -30) {
      out.push(
        item({
          id: `${helper.id}:contract-expired`,
          helperId: helper.id,
          helperName: name,
          type: "contract",
          title: tr("rem.expired.title"),
          body: tr("rem.expired.body", { poss, date: displayISO(end) }),
          date: end,
          urgency: "expired",
        })
      );
    }
  }

  if (start) {
    const paidFrom = paidStatutoryStart(start);
    const daysToPaid = daysBetween(today, paidFrom);
    if (daysToPaid <= 14 && daysToPaid >= -30) {
      out.push(
        item({
          id: `${helper.id}:sh-paid`,
          helperId: helper.id,
          helperName: name,
          type: "statutory-pay",
          title:
            daysToPaid > 0
              ? tp("rem.shpaid.in", daysToPaid)
              : daysToPaid === 0
                ? tr("rem.shpaid.today")
                : tr("rem.shpaid.started"),
          body: tr("rem.shpaid.body", { start: displayISO(start), paid: displayISO(paidFrom) }),
          date: paidFrom,
          urgency: daysToPaid <= 0 ? "watch" : "info",
        })
      );
    }

    const vest = annualLeaveVestDate(start);
    const daysToVest = daysBetween(today, vest);
    if (daysToVest <= 14 && daysToVest >= -30) {
      out.push(
        item({
          id: `${helper.id}:annual-vest`,
          helperId: helper.id,
          helperName: name,
          type: "annual",
          title:
            daysToVest > 0
              ? tp("rem.annual.in", daysToVest)
              : daysToVest === 0
                ? tr("rem.annual.today")
                : tr("rem.annual.started"),
          body: tr("rem.annual.body", { who, vest: displayISO(vest) }),
          date: vest,
          urgency: daysToVest <= 0 ? "watch" : "info",
        })
      );
    }
  }

  const docs = ["visaExpiry", "passportExpiry"];
  for (const key of docs) {
    const date = helper[key];
    if (!date) continue;
    const days = daysBetween(today, date);
    if (days <= 90 && days >= -14) {
      out.push(
        item({
          id: `${helper.id}:${key}`,
          helperId: helper.id,
          helperName: name,
          type: "document",
          title:
            days < 0
              ? tr(`rem.doc.${key}.past`)
              : days === 0
                ? tr(`rem.doc.${key}.today`)
                : tp(`rem.doc.${key}.left`, days),
          body: tr("rem.doc.body", { poss, noun: tr(`rem.doc.${key}.noun`), date: displayISO(date) }),
          date,
          urgency: urgencyForDays(days),
        })
      );
    }
  }

  if (isArrangedRestPolicy(helper.restDay)) {
    const from = today;
    const until = formatISO(addDays(today, 55));
    const arranged = Array.isArray(opts.arrangedRestDays) ? opts.arrangedRestDays : [];
    const gaps = restDayGaps(helper, arranged, from, until);
    if (gaps.length) {
      const g = gaps[0];
      out.push(
        item({
          id: `${helper.id}:rest-gap-${g.start}`,
          helperId: helper.id,
          helperName: name,
          type: "rest-gap",
          title: tr("rem.gap.title"),
          body: tr("rem.gap.body", { date: displayISO(g.start) }),
          date: g.start,
          urgency: "watch",
        })
      );
    }
  }

  return out.sort((a, b) => {
    const order = { expired: 0, critical: 1, soon: 2, watch: 3, info: 4 };
    const u = (order[a.urgency] ?? 9) - (order[b.urgency] ?? 9);
    if (u !== 0) return u;
    return a.date.localeCompare(b.date);
  });
}

export function isReminderVisible(reminder, reminderState, today) {
  const st = reminderState[reminder.id];
  if (!st) return true;
  if (st.done) return false;
  if (st.snoozeUntil && st.snoozeUntil > today) return false;
  return true;
}

export function snoozeUntil(today, days) {
  return formatISO(addDays(today, days));
}

export function reminderBadgeCount(helpers, reminderState, today, arrangedMap = {}) {
  return helpers
    .flatMap((h) => buildReminders(h, today, { arrangedRestDays: arrangedMap[h.id] || [] }))
    .filter((r) => isReminderVisible(r, reminderState, today)).length;
}
