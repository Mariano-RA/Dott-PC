// app/api/protected/route.js
import {
  withApiAuthRequired,
  getSession,
  getAccessToken,
} from "@auth0/nextjs-auth0";

export default withApiAuthRequired(async function myApiRoute(req) {
  const res = new NextResponse();
  const { user } = await getAccessToken(req, res, {
    scopes: ["offline_access"],
  }).then((response) => console.log(response));

  return NextResponse.json({ permission: user });
});
