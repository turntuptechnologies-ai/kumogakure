import type { TemplateFn } from '../../types.js';

const getBody = 'XML-RPC server accepts POST requests only.';

const faultBody = `<?xml version="1.0"?>
<methodResponse>
  <fault>
    <value>
      <struct>
        <member><name>faultCode</name><value><int>403</int></value></member>
        <member><name>faultString</name><value><string>Incorrect username or password.</string></value></member>
      </struct>
    </value>
  </fault>
</methodResponse>`;

export const wordpressXmlrpc: TemplateFn = ({ request }) => {
  if (request.method === 'POST') {
    return new Response(faultBody, {
      status: 200,
      headers: { 'Content-Type': 'text/xml; charset=UTF-8' },
    });
  }
  return new Response(getBody, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
  });
};
