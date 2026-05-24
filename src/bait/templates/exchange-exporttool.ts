import type { TemplateFn } from '../../types.js';

// Tier 1 decoy for the Exchange ClickOnce eDiscovery Export Tool
// manifest at `/ecp/Current/exporttool/microsoft.exchange.ediscovery.exporttool.application`.
// Scanners use this path as a low-noise fingerprint that the Exchange
// /ecp/ surface is reachable, then escalate to the SSRF + post-auth
// RCE chains that share that surface:
//   - CVE-2021-26855 / -26857 / -26858 / -27065 (ProxyLogon)
//   - CVE-2021-34473 / -34523 / -31207         (ProxyShell)
//   - CVE-2022-41040 / -41082                  (ProxyNotShell)
// We return a minimally-valid ClickOnce `.application` manifest with
// a fabricated build version and `example.invalid` deployment URL.
// publicKeyToken / hashes are placeholders, not derived from any real
// signing key.

const body = `<?xml version="1.0" encoding="utf-8"?>
<asmv1:assembly xsi:schemaLocation="urn:schemas-microsoft-com:asm.v1 assembly.adaptive.xsd" manifestVersion="1.0" xmlns:asmv1="urn:schemas-microsoft-com:asm.v1" xmlns:asmv2="urn:schemas-microsoft-com:asm.v2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="urn:schemas-microsoft-com:asm.v2">
  <assemblyIdentity name="microsoft.exchange.ediscovery.exporttool.application" version="15.0.0.0" publicKeyToken="0000000000000000" language="neutral" processorArchitecture="msil" xmlns="urn:schemas-microsoft-com:asm.v1" />
  <description asmv2:publisher="Example Corp." asmv2:product="eDiscovery Export Tool" xmlns="urn:schemas-microsoft-com:asm.v1" />
  <deployment install="true" mapFileExtensions="true" trustURLParameters="true" />
  <dependency>
    <dependentAssembly dependencyType="install" codebase="ExportTool.exe.manifest" size="0">
      <assemblyIdentity name="ExportTool.exe" version="15.0.0.0" publicKeyToken="0000000000000000" language="neutral" processorArchitecture="msil" type="win32" />
      <hash>
        <dsig:Transforms xmlns:dsig="http://www.w3.org/2000/09/xmldsig#">
          <dsig:Transform Algorithm="urn:schemas-microsoft-com:HashTransforms.Identity" />
        </dsig:Transforms>
        <dsig:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha256" xmlns:dsig="http://www.w3.org/2000/09/xmldsig#" />
        <dsig:DigestValue xmlns:dsig="http://www.w3.org/2000/09/xmldsig#">REDACTED_FOR_HONEYPOT</dsig:DigestValue>
      </hash>
    </dependentAssembly>
  </dependency>
  <publisherIdentity name="CN=Example Corp." issuerKeyHash="0000000000000000000000000000000000000000" />
</asmv1:assembly>`;

export const exchangeExporttool: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/x-ms-application',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
};
