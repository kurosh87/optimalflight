import type { Meta, StoryObj } from '@storybook/react';
import { AirportIntelCard } from './airport-intel-card';

const meta: Meta<typeof AirportIntelCard> = {
  title: 'Domain/AirportIntel/AirportIntelCard',
  component: AirportIntelCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AirportIntelCard>;

// Sample airport intelligence data
const tier1Airport = {
  iataCode: 'LHR',
  tier: 'tier_1',
  allLounges: [
    {
      name: 'British Airways First Lounge',
      terminal: 'Terminal 5',
      quality_rating: 9,
      has_showers: true,
      has_sleep_areas: true,
      access: ['First Class', 'Oneworld Emerald'],
    },
    {
      name: 'Cathay Pacific Lounge',
      terminal: 'Terminal 3',
      quality_rating: 8,
      has_showers: true,
      has_sleep_areas: true,
      access: ['Business Class', 'Oneworld Sapphire'],
    },
    {
      name: 'Plaza Premium Lounge',
      terminal: 'Terminal 2',
      quality_rating: 7,
      has_showers: false,
      has_sleep_areas: false,
      access: ['Priority Pass', 'Paid Access'],
    },
  ],
  connection_complexity: {
    level: 'moderate',
    avg_connection_time: 75,
    min_connection_time: 60,
    requires_security_recheck: false,
    requires_terminal_change: true,
    has_automated_transit: true,
  },
  lounge_quality: {
    rating: 8.5,
    total_lounges: 12,
    premium_lounges: 5,
    has_shower_lounges: true,
    has_sleep_pods: true,
  },
};

const tier2Airport = {
  iataCode: 'AMS',
  tier: 'tier_2',
  allLounges: [
    {
      name: 'KLM Crown Lounge',
      terminal: 'Main Terminal',
      quality_rating: 8,
      has_showers: true,
      has_sleep_areas: false,
      access: ['Business Class', 'Skyteam Elite Plus'],
    },
    {
      name: 'Aspire Lounge',
      terminal: 'Main Terminal',
      quality_rating: 6,
      has_showers: false,
      has_sleep_areas: false,
      access: ['Priority Pass'],
    },
  ],
  connection_complexity: {
    level: 'easy',
    avg_connection_time: 45,
    min_connection_time: 40,
    requires_security_recheck: false,
    requires_terminal_change: false,
    has_automated_transit: true,
  },
  lounge_quality: {
    rating: 7.5,
    total_lounges: 6,
    premium_lounges: 2,
    has_shower_lounges: true,
    has_sleep_pods: false,
  },
};

const tier3Airport = {
  iataCode: 'BOS',
  tier: 'tier_3',
  allLounges: [
    {
      name: 'Delta Sky Club',
      terminal: 'Terminal A',
      quality_rating: 6,
      has_showers: false,
      has_sleep_areas: false,
      access: ['Delta Status', 'Skyteam'],
    },
  ],
  connection_complexity: {
    level: 'complex',
    avg_connection_time: 90,
    min_connection_time: 75,
    requires_security_recheck: true,
    requires_terminal_change: true,
    has_automated_transit: false,
  },
  lounge_quality: {
    rating: 5.5,
    total_lounges: 3,
    premium_lounges: 0,
    has_shower_lounges: false,
    has_sleep_pods: false,
  },
};

// Tier 1 major hub (excellent facilities)
export const Tier1MajorHub: Story = {
  args: {
    intel: tier1Airport,
    airportName: 'London Heathrow',
    showLayoverScore: true,
  },
};

// Tier 2 regional hub
export const Tier2RegionalHub: Story = {
  args: {
    intel: tier2Airport,
    airportName: 'Amsterdam Schiphol',
    showLayoverScore: true,
  },
};

// Tier 3 domestic/regional
export const Tier3Airport: Story = {
  args: {
    intel: tier3Airport,
    airportName: 'Boston Logan',
    showLayoverScore: true,
  },
};

// Without layover score
export const WithoutLayoverScore: Story = {
  args: {
    intel: tier1Airport,
    airportName: 'London Heathrow',
    showLayoverScore: false,
  },
};

// Without airport name (just code)
export const WithoutAirportName: Story = {
  args: {
    intel: tier1Airport,
    showLayoverScore: true,
  },
};

// Many lounges
export const ManyLounges: Story = {
  args: {
    intel: {
      ...tier1Airport,
      allLounges: [
        {
          name: 'British Airways First Lounge',
          terminal: 'Terminal 5',
          quality_rating: 9,
          has_showers: true,
          has_sleep_areas: true,
          access: ['First Class'],
        },
        {
          name: 'Cathay Pacific Lounge',
          terminal: 'Terminal 3',
          quality_rating: 8,
          has_showers: true,
          has_sleep_areas: true,
          access: ['Business Class'],
        },
        {
          name: 'Virgin Atlantic Clubhouse',
          terminal: 'Terminal 3',
          quality_rating: 9,
          has_showers: true,
          has_sleep_areas: true,
          access: ['Upper Class'],
        },
        {
          name: 'Plaza Premium Lounge',
          terminal: 'Terminal 2',
          quality_rating: 7,
          has_showers: false,
          has_sleep_areas: false,
          access: ['Priority Pass'],
        },
        {
          name: 'Galleries Lounge',
          terminal: 'Terminal 5',
          quality_rating: 7,
          has_showers: false,
          has_sleep_areas: false,
          access: ['Oneworld'],
        },
        {
          name: 'No1 Lounge',
          terminal: 'Terminal 3',
          quality_rating: 8,
          has_showers: true,
          has_sleep_areas: false,
          access: ['Paid Access'],
        },
        {
          name: 'Aspire Lounge',
          terminal: 'Terminal 5',
          quality_rating: 6,
          has_showers: false,
          has_sleep_areas: false,
          access: ['Priority Pass'],
        },
      ],
    },
    airportName: 'London Heathrow',
    showLayoverScore: true,
  },
};

// Few/no lounges
export const MinimalLounges: Story = {
  args: {
    intel: {
      ...tier3Airport,
      allLounges: [
        {
          name: 'Basic Lounge',
          terminal: 'Main Terminal',
          quality_rating: 5,
          has_showers: false,
          has_sleep_areas: false,
          access: ['Paid Access'],
        },
      ],
      lounge_quality: {
        rating: 4.5,
        total_lounges: 1,
        premium_lounges: 0,
        has_shower_lounges: false,
        has_sleep_pods: false,
      },
    },
    airportName: 'Small Regional Airport',
  },
};

// Easy connections
export const EasyConnections: Story = {
  args: {
    intel: tier2Airport,
    airportName: 'Amsterdam Schiphol',
    showLayoverScore: true,
  },
};

// Complex connections
export const ComplexConnections: Story = {
  args: {
    intel: tier3Airport,
    airportName: 'Boston Logan',
    showLayoverScore: true,
  },
};

// Comparison view
export const ComparisonView: Story = {
  render: () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-w-6xl">
      <div>
        <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Tier 1 Hub</h4>
        <AirportIntelCard
          intel={tier1Airport}
          airportName="London Heathrow"
          showLayoverScore={true}
        />
      </div>
      <div>
        <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Tier 2 Hub</h4>
        <AirportIntelCard
          intel={tier2Airport}
          airportName="Amsterdam Schiphol"
          showLayoverScore={true}
        />
      </div>
      <div>
        <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Tier 3 Airport</h4>
        <AirportIntelCard
          intel={tier3Airport}
          airportName="Boston Logan"
          showLayoverScore={true}
        />
      </div>
    </div>
  ),
};

// Usage documentation
export const UsageGuidelines: Story = {
  render: () => (
    <div className="max-w-2xl space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Airport Intelligence Card</h2>
        <p className="text-muted-foreground">
          Displays comprehensive airport facilities and connection information for layover planning.
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Key Information Displayed</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>✓ Airport tier (Tier 1 major hub, Tier 2 regional, Tier 3 domestic)</li>
            <li>✓ Layover score (calculated from facilities)</li>
            <li>✓ Lounge quality rating with shower/sleep pod availability</li>
            <li>✓ Connection complexity level</li>
            <li>✓ List of all lounges with amenities</li>
          </ul>
        </div>

        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Layover Score Calculation</h3>
          <p className="text-sm text-muted-foreground">
            Calculated from:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 mt-2">
            <li>• Lounge quality and quantity</li>
            <li>• Shower facilities availability</li>
            <li>• Sleep pod availability</li>
            <li>• Connection complexity</li>
            <li>• Terminal change requirements</li>
            <li>• Security recheck requirements</li>
          </ul>
        </div>

        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Airport Tiers</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-purple-600 font-semibold">🌟 Tier 1:</span>
              <span className="text-muted-foreground">
                Major international hubs with excellent facilities (LHR, DXB, SIN, etc.)
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-semibold">⭐ Tier 2:</span>
              <span className="text-muted-foreground">
                Regional hubs with good facilities (AMS, ZRH, MUC, etc.)
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-gray-600 font-semibold">✈️ Tier 3:</span>
              <span className="text-muted-foreground">
                Domestic/regional airports with basic facilities
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
          <h3 className="font-semibold mb-2">GPT-5 Enhancement</h3>
          <p className="text-sm text-muted-foreground">
            Airport intelligence is enriched with GPT-5 analysis of facilities,
            connection complexity, and jetlag recovery amenities. Data is continuously
            updated from multiple sources including airport APIs and traveler reviews.
          </p>
        </div>
      </div>
    </div>
  ),
};
