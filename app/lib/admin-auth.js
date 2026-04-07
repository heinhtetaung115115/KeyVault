export function verifyAdmin(request) {
  const auth = request.headers.get('authorization');
  if (!auth || !auth.startsWith('Bearer ')) return false;
  const token = auth.slice(7);
  return token === process.env.ADMIN_PASSWORD;
}
