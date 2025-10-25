import type { Meta, StoryObj } from '@storybook/react';
import { FlightCard } from './flight-card';
import { Toaster } from '@/components/ui/toaster';

const meta: Meta<typeof FlightCard> = {
  title: 'Domain/Flights/FlightCard',
  component: FlightCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <>
        <Story />
        <Toaster />
      </>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof FlightCard>;

// Mock flight data
const baseFlightData = {
  id: '1',
  originAirportCode: 'JFK',
  originCity: 'New York',
  originTimezone: 'America/New_York',
  destinationAirportCode: 'LHR',
  destinationCity: 'London',
  destinationTimezone: 'Europe/London',
  departureTime: '2025-11-15T22:00:00Z',
  arrivalTime: '2025-11-16T10:00:00Z',
  status: 'confirmed',
};

// Low jetlag - short domestic flight
export const LowJetlag: Story = {
  args: {
    flight: {
      ...baseFlightData,
      id: 'low-jetlag',
      originAirportCode: 'LAX',
      originCity: 'Los Angeles',
      originTimezone: 'America/Los_Angeles',
      destinationAirportCode: 'SFO',
      destinationCity: 'San Francisco',
      destinationTimezone: 'America/Los_Angeles',
      departureTime: '2025-11-15T09:00:00Z',
      arrivalTime: '2025-11-15T10:30:00Z',
      duration: 90, // 1.5 hours
      airline: 'United Airlines',
      flightNumber: 'UA 123',
    },
  },
};

// Moderate jetlag - cross-country
export const ModerateJetlag: Story = {
  args: {
    flight: {
      ...baseFlightData,
      originAirportCode: 'LAX',
      originCity: 'Los Angeles',
      originTimezone: 'America/Los_Angeles',
      destinationAirportCode: 'JFK',
      destinationCity: 'New York',
      destinationTimezone: 'America/New_York',
      departureTime: '2025-11-15T08:00:00Z',
      arrivalTime: '2025-11-15T16:30:00Z',
      duration: 330, // 5.5 hours
      airline: 'Delta',
      flightNumber: 'DL 456',
    },
  },
};

// High jetlag - transatlantic eastward (harder)
export const HighJetlagEastward: Story = {
  args: {
    flight: {
      ...baseFlightData,
      originAirportCode: 'JFK',
      originCity: 'New York',
      originTimezone: 'America/New_York',
      destinationAirportCode: 'LHR',
      destinationCity: 'London',
      destinationTimezone: 'Europe/London',
      departureTime: '2025-11-15T22:00:00Z',
      arrivalTime: '2025-11-16T10:00:00Z',
      duration: 420, // 7 hours
      airline: 'British Airways',
      flightNumber: 'BA 178',
      sleepQualityOverride: 'good',
      adaptabilityOverride: 'average',
    },
  },
};

// Very high jetlag - transpacific
export const VeryHighJetlag: Story = {
  args: {
    flight: {
      ...baseFlightData,
      originAirportCode: 'SFO',
      originCity: 'San Francisco',
      originTimezone: 'America/Los_Angeles',
      destinationAirportCode: 'SYD',
      destinationCity: 'Sydney',
      destinationTimezone: 'Australia/Sydney',
      departureTime: '2025-11-15T23:30:00Z',
      arrivalTime: '2025-11-17T08:00:00Z',
      duration: 870, // 14.5 hours
      airline: 'Qantas',
      flightNumber: 'QF 73',
      sleepQualityOverride: 'poor',
      adaptabilityOverride: 'low',
    },
  },
};

// Westward travel (easier)
export const WestwardTravel: Story = {
  args: {
    flight: {
      ...baseFlightData,
      originAirportCode: 'LHR',
      originCity: 'London',
      originTimezone: 'Europe/London',
      destinationAirportCode: 'JFK',
      destinationCity: 'New York',
      destinationTimezone: 'America/New_York',
      departureTime: '2025-11-15T11:00:00Z',
      arrivalTime: '2025-11-15T14:00:00Z',
      duration: 480, // 8 hours
      airline: 'American Airlines',
      flightNumber: 'AA 100',
    },
  },
};

// With callbacks
export const WithEditAndDelete: Story = {
  args: {
    flight: {
      ...baseFlightData,
      duration: 420,
      airline: 'Virgin Atlantic',
      flightNumber: 'VS 3',
    },
    onEdit: () => alert('Edit clicked'),
    onDelete: () => alert('Delete clicked'),
  },
};

// Expanded state
export const ExpandedByDefault: Story = {
  render: (args) => {
    // Simulates expanded state by clicking the expand button
    return (
      <div className="max-w-md">
        <FlightCard {...args} />
      </div>
    );
  },
  args: {
    flight: {
      ...baseFlightData,
      duration: 420,
      airline: 'British Airways',
      flightNumber: 'BA 178',
      sleepQualityOverride: 'excellent',
      adaptabilityOverride: 'high',
    },
  },
};

// Without airline info
export const WithoutAirlineInfo: Story = {
  args: {
    flight: {
      ...baseFlightData,
      airline: undefined,
      flightNumber: undefined,
      duration: 420,
    },
  },
};

// With poor sleep quality
export const PoorSleepQuality: Story = {
  args: {
    flight: {
      ...baseFlightData,
      duration: 420,
      airline: 'British Airways',
      sleepQualityOverride: 'poor',
      adaptabilityOverride: 'low',
    },
  },
};

// With excellent sleep quality
export const ExcellentSleepQuality: Story = {
  args: {
    flight: {
      ...baseFlightData,
      duration: 420,
      airline: 'British Airways',
      sleepQualityOverride: 'excellent',
      adaptabilityOverride: 'high',
    },
  },
};

// Short duration flight
export const ShortFlight: Story = {
  args: {
    flight: {
      ...baseFlightData,
      originAirportCode: 'BOS',
      originCity: 'Boston',
      destinationAirportCode: 'DCA',
      destinationCity: 'Washington',
      originTimezone: 'America/New_York',
      destinationTimezone: 'America/New_York',
      duration: 90,
      airline: 'JetBlue',
      flightNumber: 'B6 453',
    },
  },
};

// Long duration flight
export const LongHaulFlight: Story = {
  args: {
    flight: {
      ...baseFlightData,
      originAirportCode: 'SIN',
      originCity: 'Singapore',
      destinationAirportCode: 'EWR',
      destinationCity: 'Newark',
      originTimezone: 'Asia/Singapore',
      destinationTimezone: 'America/New_York',
      duration: 1020, // 17 hours
      airline: 'Singapore Airlines',
      flightNumber: 'SQ 21',
    },
  },
};

// Mobile/Compact view for Chrome Extension
export const CompactView: Story = {
  args: {
    flight: {
      ...baseFlightData,
      duration: 420,
      airline: 'British Airways',
      flightNumber: 'BA 178',
    },
  },
  globals: {
    viewport: {
      value: 'mobile',
      isRotated: false
    }
  },
};

// All severity levels
export const AllSeverityLevels: Story = {
  render: () => (
    <div className="space-y-4 max-w-2xl">
      <h3 className="font-semibold">Different Jetlag Severity Levels</h3>
      <FlightCard
        flight={{
          ...baseFlightData,
          id: 'minimal',
          originAirportCode: 'LAX',
          destinationAirportCode: 'SFO',
          originCity: 'Los Angeles',
          destinationCity: 'San Francisco',
          originTimezone: 'America/Los_Angeles',
          destinationTimezone: 'America/Los_Angeles',
          duration: 90,
        }}
      />
      <FlightCard
        flight={{
          ...baseFlightData,
          id: 'moderate',
          duration: 420,
          airline: 'British Airways',
        }}
      />
      <FlightCard
        flight={{
          ...baseFlightData,
          id: 'severe',
          originAirportCode: 'SFO',
          destinationAirportCode: 'SYD',
          originCity: 'San Francisco',
          destinationCity: 'Sydney',
          originTimezone: 'America/Los_Angeles',
          destinationTimezone: 'Australia/Sydney',
          duration: 870,
        }}
      />
    </div>
  ),
};

// Business Logic Testing Scenarios
export const UsageGuidelines: Story = {
  render: () => (
    <div className="space-y-6 max-w-2xl p-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">FlightCard Component</h2>
        <p className="text-muted-foreground">
          Displays flight information with calculated jetlag metrics and recovery recommendations.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Key Features</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>✓ Automatic jetlag severity calculation</li>
            <li>✓ Personalized recovery day estimates</li>
            <li>✓ Direction-based impact (eastward harder)</li>
            <li>✓ Expandable recovery plan details</li>
            <li>✓ Calendar download for recovery protocol</li>
            <li>✓ Edit and delete functionality</li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Business Logic</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>Timezone difference:</strong> Calculated from IANA timezones</li>
            <li>• <strong>Travel direction:</strong> East vs west impact</li>
            <li>• <strong>Duration factor:</strong> Longer flights = more fatigue</li>
            <li>• <strong>User profile:</strong> Sleep quality & adaptability adjustments</li>
            <li>• <strong>Recovery days:</strong> Based on Burgess & Eastman (2005) research</li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Severity Levels</h3>
          <div className="flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-green-100 text-green-800">
              Minimal (0-1 timezones)
            </div>
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
              Mild (2-3 timezones)
            </div>
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">
              Moderate (4-5 timezones)
            </div>
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-orange-100 text-orange-800">
              Severe (6-8 timezones)
            </div>
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-red-100 text-red-800">
              Very Severe (9+ timezones)
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};
