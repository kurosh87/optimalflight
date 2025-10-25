/**
 * Day 13 Email - Trial Ending Reminder
 * Last chance to subscribe before trial ends
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

interface Day13EmailProps {
  userName?: string;
  trialEndsDate: string;
}

export default function Day13TrialEndingEmail({
  userName = 'there',
  trialEndsDate,
}: Day13EmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your FlightOptima trial ends in 24 hours - Don't lose access!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={urgentBox}>
            <Text style={urgentText}>⏰ Your trial ends tomorrow</Text>
          </Section>

          <Heading style={h1}>Don't Lose Your Premium Access!</Heading>

          <Text style={text}>Hi {userName},</Text>

          <Text style={text}>
            Your 14-day Pro trial ends <strong>{trialEndsDate}</strong> (tomorrow!).
          </Text>

          <Section style={statsBox}>
            <Text style={statsTitle}>During your trial, you:</Text>
            <Text style={statsItem}>✓ Searched flights with jetlag optimization</Text>
            <Text style={statsItem}>✓ Filtered by airline alliances</Text>
            <Text style={statsItem}>✓ Discovered virtual interline routes</Text>
            <Text style={statsItem}>✓ Found healthier flight options</Text>
          </Section>

          <Text style={text}>
            <strong>Keep these features for just $99/year</strong> (less than $8.25/month)
          </Text>

          <Section style={benefitsBox}>
            <Text style={benefitsTitle}>What you'll lose tomorrow:</Text>
            <Text style={benefitItem}>❌ Unlimited searches (back to 10/day)</Text>
            <Text style={benefitItem}>❌ Alliance filtering</Text>
            <Text style={benefitItem}>❌ Jetlag optimization scores</Text>
            <Text style={benefitItem}>❌ Price alerts (back to 0)</Text>
            <Text style={benefitItem}>❌ Ad-free experience</Text>
          </Section>

          <Button style={button} href="https://flight-optima-lbhxlbna7-pejmans-projects-75cd31ff.vercel.app/pricing">
            Continue Pro for $99/year
          </Button>

          <Section style={testimonialBox}>
            <Text style={testimonialQuote}>
              "FlightOptima saved me 2 days of jetlag on my Tokyo trip. Worth every penny!"
            </Text>
            <Text style={testimonialAuthor}>
              - Sarah M., Business Traveler
            </Text>
          </Section>

          <Text style={text}>
            Questions? Reply to this email - we're here to help!
          </Text>

          <Text style={signature}>
            We hope you'll stay,
            <br />
            The FlightOptima Team
          </Text>

          <Section style={footer}>
            <Text style={footerText}>
              Don't want to upgrade? No problem - you'll keep free access.
              <br />
              You can always upgrade later at any time.
            </Text>
          </Section>
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

const urgentBox = {
  backgroundColor: '#fef2f2',
  border: '2px solid #ef4444',
  borderRadius: '8px',
  margin: '24px',
  padding: '16px',
  textAlign: 'center' as const,
};

const urgentText = {
  color: '#dc2626',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: 0,
};

const h1 = {
  color: '#333',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '24px',
  textAlign: 'center' as const,
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 24px',
};

const statsBox = {
  backgroundColor: '#f0fdf4',
  borderRadius: '8px',
  margin: '24px',
  padding: '20px',
};

const statsTitle = {
  color: '#166534',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
};

const statsItem = {
  color: '#15803d',
  fontSize: '14px',
  margin: '8px 0',
};

const benefitsBox = {
  backgroundColor: '#fef2f2',
  borderRadius: '8px',
  margin: '24px',
  padding: '20px',
};

const benefitsTitle = {
  color: '#991b1b',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
};

const benefitItem = {
  color: '#b91c1c',
  fontSize: '14px',
  margin: '8px 0',
};

const button = {
  backgroundColor: '#ff6b6b',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '18px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '16px 32px',
  margin: '24px',
};

const testimonialBox = {
  borderLeft: '4px solid #ff6b6b',
  margin: '24px',
  padding: '16px 24px',
  fontStyle: 'italic',
};

const testimonialQuote = {
  color: '#555',
  fontSize: '16px',
  margin: '0 0 8px 0',
};

const testimonialAuthor = {
  color: '#999',
  fontSize: '14px',
  margin: 0,
};

const signature = {
  color: '#666',
  fontSize: '14px',
  margin: '32px 24px',
};

const footer = {
  borderTop: '1px solid #eee',
  margin: '32px 24px 0',
  paddingTop: '16px',
};

const footerText = {
  color: '#999',
  fontSize: '12px',
  textAlign: 'center' as const,
  margin: 0,
};
