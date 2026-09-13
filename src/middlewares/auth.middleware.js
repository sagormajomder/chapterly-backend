import admin from '../config/firebase.js';

export async function verifyFireBaseToken(req, res, next) {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({
      message: 'unauthorized access',
    });
  }
  const token = authorization.split(' ')[1];

  if (!token) {
    return res.status(401).send({
      message: 'unauthorized access. Token not found!',
    });
  }

  try {
    const tokenInfo = await admin.auth().verifyIdToken(token);
    req.token_email = tokenInfo.email;
    next();
  } catch (error) {
    console.error('Invalid Token:', error);
    res.status(401).send({
      message: 'unauthorized access.',
    });
  }
}
