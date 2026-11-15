/** Lets Node import the app's cache-busted specifiers (`./file.js?v=21`). */
export async function resolve(specifier, context, nextResolve) {
  const clean = specifier.replace(/\?v=\d+/, "");
  return nextResolve(clean, context);
}
