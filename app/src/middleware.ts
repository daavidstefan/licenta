// middleware pentru redirecturi si protectie

import withAuth from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    // protejeaza tot ce NU e /, /login, api/auth și static
    "/((?!$|login|devregister|complete-dev-registration|api/auth|api/dev-requests|api/verify-request|api/dev-invitations|verifyrequest|_next/static|_next/image|favicon.ico|assets|.*\\..*).+)",
  ],
};
