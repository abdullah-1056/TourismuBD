export const GUEST_PUBLIC_VIEWS = Object.freeze(["home", "explore"]);

export function viewRequiresAuthentication(view, user) {
  return !user && !GUEST_PUBLIC_VIEWS.includes(view);
}
