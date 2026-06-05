
/** Consume Google redirect result exactly once per page load (React Strict Mode safe). */
let redirectResultPromise = null;

export function consumeGoogleRedirectResult(auth, getRedirectResult) {
  if (!redirectResultPromise) {
    redirectResultPromise = getRedirectResult(auth).catch((err) => {
      redirectResultPromise = null;
      throw err;
    });
  }
  return redirectResultPromise;
}
