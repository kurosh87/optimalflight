/**
 * Day 2 Email - Feature Highlight: Virtual Interlining
 * Educate users about Kiwi's unique value
 */

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface Day2EmailProps {
  userName?: string;
}

export default function Day2VirtualInterliningEmail({ userName = 'there' }: Day2EmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Discover routes nobody else offers - Virtual Interlining explained</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Routes Nobody Else Offers ✨</Heading>

          <Text style={text}>Hi {userName},</Text>

          <Text style={text}>
            Did you know FlightOptima can find flight combinations that traditional search engines can't?
          </Text>

          <Section style={featureBox}>
            <Text style={featureTitle}>🌟 Virtual Interlining</Text>
            <Text style={featureDescription}>
              We combine carriers that don't normally work together - often saving you 20-40% vs traditional routing!
            </Text>
          </Section>

          <Heading style={h2}>How It Works:</Heading>

          <Text style={text}>
            <strong>Traditional booking:</strong> You're limited to airlines that have agreements with each other
          </Text>

          <Text style={text}>
            <strong>With FlightOptima:</strong> We mix-and-match ANY carriers to find the best price and schedule
          </Text>

          <Section style={exampleBox}>
            <Text style={exampleTitle}>Real Example:</Text>
            <Text style={exampleText}>
              <strong>NYC to Bangkok</strong>
              <br />
              Traditional route: United all the way - $1,200
              <br />
              Virtual Interline: United + AirAsia - $750
              <br />
              <strong>💰 Save $450 (38%!)</strong>
            </Text>
          </Section>

          <Section style={guaranteeBox}>
            <Text style={guaranteeTitle}>🛡️ Protected by Kiwi.com Guarantee</Text>
            <Text style={guaranteeText}>
              Don't worry about missed connections! Kiwi.com rebooksyou for free if anything goes wrong.
            </Text>
          </Section>

          <Button style={button} href="https://flight-optima-lbhxlbna7-pejmans-projects-75cd31ff.vercel.app/search">
            Find Virtual Interline Deals
          </Button>

          <Text style={text}>
            Try searching a long-haul route (US to Asia, Europe to Australia) to see virtual interlining in action!
          </Text>

          <Text style={signature}>
            Happy hunting,
            <br />
            The FlightOptima Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '600px',
};

const h1 = {
  color: '#ff6b6b',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0 24px',
  textAlign: 'center' as const,
};

const h2 = {
  color: '#333',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '24px 24px 12px',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 24px',
};

const featureBox = {
  backgroundColor: '#f0f9ff',
  border: '2px solid #3b82f6',
  borderRadius: '8px',
  margin: '24px',
  padding: '24px',
  textAlign: 'center' as const,
};

const featureTitle = {
  color: '#1e40af',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
};

const featureDescription = {
  color: '#1e40af',
  fontSize: '16px',
  margin: 0,
};

const exampleBox = {
  backgroundColor: '#fef3c7',
  borderLeft: '4px solid #f59e0b',
  margin: '24px',
  padding: '16px 24px',
};

const exampleTitle = {
  color: '#92400e',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
};

const exampleText = {
  color: '#78350f',
  fontSize: '14px',
  lineHeight: '22px',
  margin: 0,
};

const guaranteeBox = {
  backgroundColor: '#ecfdf5',
  border: '1px solid #10b981',
  borderRadius: '8px',
  margin: '24px',
  padding: '16px',
};

const guaranteeTitle = {
  color: '#065f46',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
};

const guaranteeText = {
  color: '#047857',
  fontSize: '14px',
  margin: 0,
};

const button = {
  backgroundColor: '#ff6b6b',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '14px 24px',
  margin: '24px',
};

const signature = {
  color: '#666',
  fontSize: '14px',
  margin: '32px 24px',
};
