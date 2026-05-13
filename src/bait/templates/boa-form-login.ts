import type { TemplateFn } from '../../types.js';

const body = `<html>
<head>
<title>Login</title>
<meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1">
</head>
<body bgcolor="#FFFFFF">
<form action="/boaform/admin/formLogin" method="post" name="frmLogin">
<table>
<tr><td>User:</td><td><input type="text" name="username" size="20"></td></tr>
<tr><td>Password:</td><td><input type="password" name="psd" size="20"></td></tr>
<tr><td colspan="2" align="center"><input type="submit" name="submit-url" value="OK"></td></tr>
</table>
</form>
</body>
</html>
`;

export const boaFormLogin: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-store, no-cache',
    },
  });
};
