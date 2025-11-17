import * as React from 'react'
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Heading,
} from '@react-email/components'

interface PatientInvitationEmailProps {
  doctorName: string
  invitationUrl: string
}

export const PatientInvitationEmail: React.FC<PatientInvitationEmailProps> = ({
  doctorName,
  invitationUrl,
}) => (
  <Html>
    <Head />
    <Body style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      lineHeight: '1.6',
      color: '#333',
      backgroundColor: '#f5f5f5',
    }}>
      <Container style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '20px',
      }}>
        {/* Header */}
        <Section style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '30px',
          borderRadius: '8px 8px 0 0',
          textAlign: 'center' as const,
        }}>
          <Heading style={{ margin: 0, fontSize: '28px', color: 'white' }}>
            🏥 Health App Invitation
          </Heading>
        </Section>

        {/* Content */}
        <Section style={{
          background: '#ffffff',
          padding: '30px',
          border: '1px solid #e5e7eb',
          borderTop: 'none',
        }}>
          <Heading style={{ color: '#667eea', marginTop: 0, fontSize: '24px' }}>
            You&apos;ve been invited!
          </Heading>

          <Text>Hello,</Text>

          <Text>
            <strong>{doctorName}</strong> has invited you to join their patient portal on Health App.
          </Text>

          <Text>This secure portal will allow you to:</Text>

          <ul style={{ lineHeight: '1.8' }}>
            <li>Complete your health profile</li>
            <li>Communicate with your doctor</li>
            <li>Access your medical information</li>
            <li>Schedule appointments</li>
          </ul>

          <Section style={{ textAlign: 'center' as const, margin: '30px 0' }}>
            <Link
              href={invitationUrl}
              style={{
                display: 'inline-block',
                background: '#667eea',
                color: 'white',
                textDecoration: 'none',
                padding: '14px 28px',
                borderRadius: '6px',
                fontWeight: '600',
              }}
            >
              Accept Invitation & Create Profile
            </Link>
          </Section>

          <Section style={{
            background: '#fef3c7',
            borderLeft: '4px solid #f59e0b',
            padding: '12px',
            margin: '20px 0',
            borderRadius: '4px',
          }}>
            <Text style={{ margin: 0 }}>
              <strong>⚠️ Security Notice:</strong> This invitation link is unique to you.
              Please do not share it with others.
            </Text>
          </Section>

          <Text style={{ fontSize: '14px', color: '#6b7280' }}>
            If the button doesn&apos;t work, copy and paste this link into your browser:
          </Text>
          <Text style={{ fontSize: '14px' }}>
            <Link href={invitationUrl} style={{ color: '#667eea', wordBreak: 'break-all' }}>
              {invitationUrl}
            </Link>
          </Text>
        </Section>

        {/* Footer */}
        <Section style={{
          background: '#f9fafb',
          padding: '20px',
          borderRadius: '0 0 8px 8px',
          textAlign: 'center' as const,
          border: '1px solid #e5e7eb',
          borderTop: 'none',
        }}>
          <Text style={{ margin: '5px 0', fontSize: '14px', color: '#6b7280' }}>
            This invitation was sent by {doctorName}
          </Text>
          <Text style={{ margin: '5px 0', fontSize: '12px', color: '#6b7280' }}>
            If you didn&apos;t expect this invitation, you can safely ignore this email.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default PatientInvitationEmail

