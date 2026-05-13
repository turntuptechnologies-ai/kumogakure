import type { TemplateFn } from '../../types.js';

const body = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
<soap:Body>
<GetDeviceSettingsResponse xmlns="http://purenetworks.com/HNAP1/">
<GetDeviceSettingsResult>OK</GetDeviceSettingsResult>
<Type>GatewayWithWiFi</Type>
<DeviceName>Wireless Router</DeviceName>
<VendorName>Example</VendorName>
<ModelDescription>Wireless Gigabit Router</ModelDescription>
<ModelName>EX-1000</ModelName>
<FirmwareVersion>1.00</FirmwareVersion>
<PresentationURL>http://192.168.0.1</PresentationURL>
<SubDeviceURLs></SubDeviceURLs>
<LANIPAddress>192.168.0.1</LANIPAddress>
<Tasks>
<string>GetDeviceSettings</string>
<string>GetWLanRadios</string>
</Tasks>
</GetDeviceSettingsResponse>
</soap:Body>
</soap:Envelope>
`;

export const hnap1: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/xml; charset=UTF-8' },
  });
};
