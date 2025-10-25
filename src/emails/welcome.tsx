/**
 * Welcome Email - Day 0
 * Sent immediately after user signs up
 */

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface WelcomeEmailProps {
  userName?: string;
  userEmail: string;
}

export default function WelcomeEmail({
  userName = 'there',
  userEmail,
}: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to FlightOptima - Find flights optimized for your health</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to FlightOptima! ✈️</Heading>

          <Text style={text}>Hi {userName},</Text>

          <Text style={text}>
            Thanks for joining FlightOptima! You're now part of a community finding healthier, smarter flight options.
          </Text>

          <Section style={highlightBox}>
            <Text style={highlightText}>
              <strong>🎉 You get 14 days of Pro features FREE!</strong>
            </Text>
            <Text style={highlightSubtext}>
              No credit card required. Cancel anytime.
            </Text>
          </Section>

          <Heading style={h2}>Get Started in 3 Steps:</Heading>

          <Section style={stepSection}>
            <Text style={stepNumber}>1️⃣</Text>
            <Text style={stepText}>
              <strong>Search your first flight</strong>
              <br />
              Try searching JFK to LAX and see our jetlag optimization in action
            </Text>
          </Section>

          <Section style={stepSection}>
            <Text style={stepNumber}>2️⃣</Text>
            <Text style={stepText}>
              <strong>Filter by alliance</strong>
              <br />
              Use Star Alliance, OneWorld, or SkyTeam filters to find award availability
            </Text>
          </Section>

          <Section style={stepSection}>
            <Text style={stepNumber}>3️⃣</Text>
            <Text style={stepText}>
              <strong>Set a price alert</strong>
              <br />
              Get notified when prices drop on your favorite routes
            </Text>
          </Section>

          <Button style={button} href="https://flight-optima-lbhxlbna7-pejmans-projects-75cd31ff.vercel.app/search">
            Start Searching Flights
          </Button>

          <Text style={text}>
            Have questions? Just reply to this email - we're here to help!
          </Text>

          <Text style={signature}>
            Happy travels,
            <br />
            The FlightOptima Team
          </Text>

          <Section style={footer}>
            <Text style={footerText}>
              FlightOptima - Smart Flight Search with Jetlag Optimization
              <br />
              <Link href="https://flight-optima-lbhxlbna7-pejmans-projects-75cd31ff.vercel.app" style={footerLink}>
                Visit Dashboard
              </Link>
              {' • '}
              <Link href="https://flight-optima-lbhxlbna7-pejmans-projects-75cd31ff.vercel.app/profile" style={footerLink}>
                Account Settings
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const h1 = {
  color: '#ff6b6b',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0 24px',
  textAlign: 'center' as const,
};

const h2 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '32px 24px 16px',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 24px',
};

const highlightBox = {
  backgroundColor: '#fff5f5',
  border: '2px solid #ff6b6b',
  borderRadius: '8px',
  margin: '24px',
  padding: '24px',
  textAlign: 'center' as const,
};

const highlightText = {
  color: '#ff6b6b',
  fontSize: '18px',
  margin: '0 0 8px 0',
};

const highlightSubtext = {
  color: '#666',
  fontSize: '14px',
  margin: 0,
};

const stepSection = {
  margin: '16px 24px',
  display: 'flex',
  alignItems: 'flex-start',
};

const stepNumber = {
  fontSize: '24px',
  marginRight: '12px',
  minWidth: '32px',
};

const stepText = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
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
  margin: '32px 24px',
};

const signature = {
  color: '#666',
  fontSize: '14px',
  margin: '32px 24px 16px',
};

const footer = {
  borderTop: '1px solid #eee',
  margin: '32px 24px 0',
  paddingTop: '24px',
};

const footerText = {
  color: '#999',
  fontSize: '12px',
  lineHeight: '20px',
  textAlign: 'center' as const,
  margin: 0,
};

const footerLink = {
  color: '#ff6b6b',
  textDecoration: 'underline',
};
