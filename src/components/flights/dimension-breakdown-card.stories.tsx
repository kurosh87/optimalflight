import type { Meta, StoryObj } from '@storybook/react';
import { DimensionBreakdownCard } from './dimension-breakdown-card';

const meta: Meta<typeof DimensionBreakdownCard> = {
  title: 'Domain/Flights/DimensionBreakdownCard',
  component: DimensionBreakdownCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    dimension: {
      control: 'select',
      options: ['circadian', 'strategy', 'comfort', 'efficiency'],
      description: 'Which dimension to display',
    },
    compact: {
      control: 'boolean',
      description: 'Compact mode for Chrome extension',
    },
  },
};

export default meta;
type Story = StoryObj<typeof DimensionBreakdownCard>;

// Circadian dimension with high score
export const CircadianOptimal: Story = {
  args: {
    dimension: 'circadian',
    score: 92,
    weight: 45,
    subComponents: [
      {
        name: 'Departure Timing',
        score: 95,
        weight: 28,
        description: 'Flight departs during optimal window for eastward travel',
      },
      {
        name: 'Arrival Timing',
        score: 90,
        weight: 28,
        description: 'Lands at 10am local - perfect for quick adaptation',
      },
      {
        name: 'Light Exposure',
        score: 88,
        weight: 16,
        description: 'Good opportunities for strategic sunlight during flight',
      },
      {
        name: 'Sleep Opportunity',
        score: 94,
        weight: 16,
        description: 'Flight timing matches destination night cycles',
      },
      {
        name: 'Airline Lighting',
        score: 85,
        weight: 8,
        description: 'Carrier uses circadian-optimized cabin lighting',
      },
      {
        name: 'Body Clock Timing',
        score: 92,
        weight: 4,
        description: 'Excellent pre-adaptation potential',
      },
    ],
  },
};

// Strategy dimension with moderate score
export const StrategyModerate: Story = {
  args: {
    dimension: 'strategy',
    score: 68,
    weight: 25,
    subComponents: [
      {
        name: 'Routing Logic',
        score: 72,
        weight: 30,
        description: 'One connection - reasonable trade-off for price',
      },
      {
        name: 'Layover Quality',
        score: 65,
        weight: 30,
        description: '2.5 hour layover - adequate for recovery activities',
      },
      {
        name: 'Airport Facilities',
        score: 70,
        weight: 30,
        description: 'Good shower and rest facilities available',
      },
      {
        name: 'Connection Timing',
        score: 62,
        weight: 10,
        description: 'Slightly rushed connection window',
      },
    ],
  },
};

// Comfort dimension with excellent score
export const ComfortExcellent: Story = {
  args: {
    dimension: 'comfort',
    score: 86,
    weight: 20,
    subComponents: [
      {
        name: 'Aircraft Quality',
        score: 92,
        weight: 35,
        description: 'Boeing 787 Dreamliner - excellent sleep score',
      },
      {
        name: 'Airline Service',
        score: 85,
        weight: 30,
        description: 'Premium carrier with top-tier service',
      },
      {
        name: 'Cabin Pressure',
        score: 88,
        weight: 15,
        description: 'Lower cabin altitude reduces fatigue',
      },
      {
        name: 'Cabin Class',
        score: 75,
        weight: 10,
        description: 'Economy Plus with extra legroom',
      },
      {
        name: 'Humidity',
        score: 90,
        weight: 5,
        description: 'Advanced humidity control system',
      },
      {
        name: 'Next-Gen Bonus',
        score: 95,
        weight: 5,
        description: '787 features reduce jetlag by 15-20%',
      },
    ],
  },
};

// Efficiency dimension
export const EfficiencyGood: Story = {
  args: {
    dimension: 'efficiency',
    score: 74,
    weight: 10,
    subComponents: [
      {
        name: 'Total Duration',
        score: 78,
        weight: 40,
        description: '8 hours total - well balanced',
      },
      {
        name: 'Connection Stress',
        score: 70,
        weight: 35,
        description: 'One connection adds manageable stress',
      },
      {
        name: 'Airport Congestion',
        score: 72,
        weight: 25,
        description: 'Moderate airport traffic expected',
      },
    ],
  },
};

// Low scoring example
export const CircadianChallenging: Story = {
  args: {
    dimension: 'circadian',
    score: 42,
    weight: 45,
    subComponents: [
      {
        name: 'Departure Timing',
        score: 35,
        weight: 28,
        description: 'Red-eye departure conflicts with sleep schedule',
      },
      {
        name: 'Arrival Timing',
        score: 28,
        weight: 28,
        description: 'Evening arrival is worst time for adaptation',
      },
      {
        name: 'Light Exposure',
        score: 52,
        weight: 16,
        description: 'Limited daylight opportunities',
      },
      {
        name: 'Sleep Opportunity',
        score: 38,
        weight: 16,
        description: 'Poor alignment with destination sleep cycles',
      },
      {
        name: 'Airline Lighting',
        score: 45,
        weight: 8,
        description: 'Basic cabin lighting protocol',
      },
      {
        name: 'Body Clock Timing',
        score: 40,
        weight: 4,
        description: 'Difficult pre-adaptation window',
      },
    ],
  },
};

// Without sub-components
export const NoSubComponents: Story = {
  args: {
    dimension: 'circadian',
    score: 82,
    weight: 45,
  },
};

// Compact view
export const CompactView: Story = {
  args: {
    dimension: 'circadian',
    score: 78,
    weight: 45,
    compact: true,
    subComponents: [
      { name: 'Departure Timing', score: 82, weight: 28 },
      { name: 'Arrival Timing', score: 75, weight: 28 },
      { name: 'Light Exposure', score: 76, weight: 16 },
    ],
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
  },
};

// All dimensions showcase
export const AllDimensions: Story = {
  render: () => (
    <div className="grid gap-4 max-w-4xl md:grid-cols-2">
      <DimensionBreakdownCard
        dimension="circadian"
        score={92}
        weight={45}
        subComponents={[
          { name: 'Departure Timing', score: 95, weight: 28 },
          { name: 'Arrival Timing', score: 90, weight: 28 },
          { name: 'Light Exposure', score: 88, weight: 16 },
        ]}
      />
      <DimensionBreakdownCard
        dimension="strategy"
        score={75}
        weight={25}
        subComponents={[
          { name: 'Routing Logic', score: 80, weight: 30 },
          { name: 'Layover Quality', score: 72, weight: 30 },
          { name: 'Airport Facilities', score: 70, weight: 30 },
        ]}
      />
      <DimensionBreakdownCard
        dimension="comfort"
        score={86}
        weight={20}
        subComponents={[
          { name: 'Aircraft Quality', score: 92, weight: 35 },
          { name: 'Airline Service', score: 85, weight: 30 },
          { name: 'Cabin Pressure', score: 80, weight: 15 },
        ]}
      />
      <DimensionBreakdownCard
        dimension="efficiency"
        score={74}
        weight={10}
        subComponents={[
          { name: 'Total Duration', score: 78, weight: 40 },
          { name: 'Connection Stress', score: 70, weight: 35 },
        ]}
      />
    </div>
  ),
};

// Usage documentation
export const UsageGuidelines: Story = {
  render: () => (
    <div className="max-w-2xl space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Dimension Breakdown Card</h2>
        <p className="text-muted-foreground">
          Detailed breakdown of a single dimension of the holistic jetlag score.
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Four Dimensions</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <div className="font-semibold min-w-[120px] text-purple-600">Circadian (45%)</div>
              <div className="text-muted-foreground">
                6 sub-components: departure/arrival timing, light exposure, sleep opportunities
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="font-semibold min-w-[120px] text-blue-600">Strategy (25%)</div>
              <div className="text-muted-foreground">
                4 sub-components: routing logic, layover quality, facilities, connection timing
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="font-semibold min-w-[120px] text-green-600">Comfort (20%)</div>
              <div className="text-muted-foreground">
                6 sub-components: aircraft, airline, pressure, class, humidity, next-gen features
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="font-semibold min-w-[120px] text-orange-600">Efficiency (10%)</div>
              <div className="text-muted-foreground">
                3 sub-components: duration, connection stress, airport congestion
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Sub-Component Weights</h3>
          <p className="text-sm text-muted-foreground">
            Each dimension is broken down into weighted sub-components that sum to 100%.
            The sub-component scores are multiplied by their weights and combined to create
            the dimension score.
          </p>
        </div>

        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Use Cases</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Show detailed breakdown when user clicks "View Details"</li>
            <li>• Explain why a flight has a particular score</li>
            <li>• Help users understand trade-offs between dimensions</li>
            <li>• Identify specific areas for optimization</li>
          </ul>
        </div>
      </div>
    </div>
  ),
};
