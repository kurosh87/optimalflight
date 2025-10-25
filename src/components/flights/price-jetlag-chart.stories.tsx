import type { Meta, StoryObj } from '@storybook/react';
import { PriceJetlagChart } from './price-jetlag-chart';

const meta: Meta<typeof PriceJetlagChart> = {
  title: 'Domain/Flights/PriceJetlagChart',
  component: PriceJetlagChart,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    width: {
      control: { type: 'number', min: 400, max: 1200, step: 100 },
      description: 'Chart width in pixels',
    },
    height: {
      control: { type: 'number', min: 300, max: 800, step: 50 },
      description: 'Chart height in pixels',
    },
  },
};

export default meta;
type Story = StoryObj<typeof PriceJetlagChart>;

// Sample flight data for stories
const sampleFlights = [
  { id: '1', price: 450, jetlagScore: 78, category: 'best-value' as const },
  { id: '2', price: 280, jetlagScore: 58, category: 'cheapest' as const },
  { id: '3', price: 620, jetlagScore: 92, category: 'best-jetlag' as const },
  { id: '4', price: 380, jetlagScore: 72, category: 'balanced' as const },
  { id: '5', price: 520, jetlagScore: 65 },
  { id: '6', price: 340, jetlagScore: 48 },
  { id: '7', price: 720, jetlagScore: 85 },
  { id: '8', price: 295, jetlagScore: 52 },
];

// Default chart
export const Default: Story = {
  args: {
    flights: sampleFlights,
    priceRange: { min: 250, max: 750 },
    jetlagRange: { min: 40, max: 100 },
  },
};

// With highlighted flight
export const WithHighlightedFlight: Story = {
  args: {
    flights: sampleFlights,
    priceRange: { min: 250, max: 750 },
    jetlagRange: { min: 40, max: 100 },
    highlightedFlightId: '1', // Best value option
  },
};

// Few flights
export const FewFlights: Story = {
  args: {
    flights: [
      { id: '1', price: 450, jetlagScore: 78, category: 'best-value' as const },
      { id: '2', price: 280, jetlagScore: 58, category: 'cheapest' as const },
      { id: '3', price: 620, jetlagScore: 92, category: 'best-jetlag' as const },
    ],
    priceRange: { min: 250, max: 650 },
    jetlagRange: { min: 50, max: 100 },
  },
};

// Many flights
export const ManyFlights: Story = {
  args: {
    flights: [
      { id: '1', price: 450, jetlagScore: 78, category: 'best-value' as const },
      { id: '2', price: 280, jetlagScore: 58, category: 'cheapest' as const },
      { id: '3', price: 620, jetlagScore: 92, category: 'best-jetlag' as const },
      { id: '4', price: 380, jetlagScore: 72, category: 'balanced' as const },
      { id: '5', price: 520, jetlagScore: 65 },
      { id: '6', price: 340, jetlagScore: 48 },
      { id: '7', price: 720, jetlagScore: 85 },
      { id: '8', price: 295, jetlagScore: 52 },
      { id: '9', price: 490, jetlagScore: 75 },
      { id: '10', price: 550, jetlagScore: 68 },
      { id: '11', price: 320, jetlagScore: 55 },
      { id: '12', price: 680, jetlagScore: 88 },
      { id: '13', price: 410, jetlagScore: 70 },
      { id: '14', price: 350, jetlagScore: 62 },
      { id: '15', price: 590, jetlagScore: 82 },
    ],
    priceRange: { min: 250, max: 750 },
    jetlagRange: { min: 40, max: 100 },
  },
};

// Tight price range
export const TightPriceRange: Story = {
  args: {
    flights: [
      { id: '1', price: 450, jetlagScore: 92, category: 'best-jetlag' as const },
      { id: '2', price: 420, jetlagScore: 78, category: 'best-value' as const },
      { id: '3', price: 480, jetlagScore: 85, category: 'balanced' as const },
      { id: '4', price: 440, jetlagScore: 72 },
      { id: '5', price: 460, jetlagScore: 68 },
    ],
    priceRange: { min: 400, max: 500 },
    jetlagRange: { min: 60, max: 100 },
  },
};

// Wide score variation
export const WideScoreVariation: Story = {
  args: {
    flights: [
      { id: '1', price: 350, jetlagScore: 95, category: 'best-jetlag' as const },
      { id: '2', price: 400, jetlagScore: 35 },
      { id: '3', price: 300, jetlagScore: 72 },
      { id: '4', price: 450, jetlagScore: 52 },
      { id: '5', price: 320, jetlagScore: 88 },
    ],
    priceRange: { min: 280, max: 470 },
    jetlagRange: { min: 30, max: 100 },
  },
};

// All in optimal zone (top-left)
export const AllOptimal: Story = {
  args: {
    flights: [
      { id: '1', price: 300, jetlagScore: 92, category: 'best-value' as const },
      { id: '2', price: 320, jetlagScore: 88 },
      { id: '3', price: 290, jetlagScore: 90, category: 'cheapest' as const },
      { id: '4', price: 310, jetlagScore: 95, category: 'best-jetlag' as const },
    ],
    priceRange: { min: 280, max: 350 },
    jetlagRange: { min: 85, max: 100 },
  },
};

// All challenging (bottom-right)
export const AllChallenging: Story = {
  args: {
    flights: [
      { id: '1', price: 650, jetlagScore: 45 },
      { id: '2', price: 680, jetlagScore: 38 },
      { id: '3', price: 620, jetlagScore: 52, category: 'cheapest' as const },
      { id: '4', price: 720, jetlagScore: 42 },
    ],
    priceRange: { min: 600, max: 750 },
    jetlagRange: { min: 35, max: 60 },
  },
};

// With click interaction
export const WithClickHandler: Story = {
  args: {
    flights: sampleFlights,
    priceRange: { min: 250, max: 750 },
    jetlagRange: { min: 40, max: 100 },
    onFlightClick: (flightId: string) => {
      alert(`Clicked flight: ${flightId}`);
    },
  },
};

// Compact size for mobile
export const CompactView: Story = {
  args: {
    flights: sampleFlights.slice(0, 5),
    priceRange: { min: 250, max: 750 },
    jetlagRange: { min: 40, max: 100 },
    width: 400,
    height: 300,
  },
  globals: {
    viewport: {
      value: 'mobile',
      isRotated: false
    }
  },
};

// Large size for desktop
export const LargeView: Story = {
  args: {
    flights: sampleFlights,
    priceRange: { min: 250, max: 750 },
    jetlagRange: { min: 40, max: 100 },
    width: 900,
    height: 600,
  },
};

// Only best-value flights
export const BestValueOnly: Story = {
  args: {
    flights: [
      { id: '1', price: 450, jetlagScore: 78, category: 'best-value' as const },
      { id: '2', price: 420, jetlagScore: 82, category: 'best-value' as const },
      { id: '3', price: 480, jetlagScore: 75, category: 'best-value' as const },
    ],
    priceRange: { min: 400, max: 500 },
    jetlagRange: { min: 70, max: 85 },
  },
};

// Comparison scenario
export const ComparisonScenario: Story = {
  render: () => {
    const flights = [
      {
        id: 'expensive-optimal',
        price: 620,
        jetlagScore: 92,
        category: 'best-jetlag' as const,
        label: 'Premium direct',
      },
      {
        id: 'mid-good',
        price: 450,
        jetlagScore: 78,
        category: 'best-value' as const,
        label: '1 stop, good timing',
      },
      {
        id: 'cheap-poor',
        price: 280,
        jetlagScore: 58,
        category: 'cheapest' as const,
        label: '2 stops, red-eye',
      },
    ];

    return (
      <div className="space-y-4 max-w-3xl">
        <div className="space-y-2">
          <h3 className="font-semibold">Flight Options Comparison</h3>
          <p className="text-sm text-muted-foreground">
            Visualizing the price-jetlag trade-off for your route
          </p>
        </div>
        <PriceJetlagChart
          flights={flights}
          priceRange={{ min: 250, max: 650 }}
          jetlagRange={{ min: 50, max: 100 }}
          onFlightClick={(id) => console.log('Selected:', id)}
        />
        <div className="grid gap-3 md:grid-cols-3 text-sm">
          <div className="p-3 border rounded-lg">
            <div className="font-semibold text-blue-600">Best Jetlag: $620</div>
            <div className="text-muted-foreground">Score: 92 (Optimal)</div>
            <div className="text-xs mt-1">+$340 vs cheapest</div>
          </div>
          <div className="p-3 border rounded-lg">
            <div className="font-semibold text-purple-600">Best Value: $450</div>
            <div className="text-muted-foreground">Score: 78 (Excellent)</div>
            <div className="text-xs mt-1">Balanced option</div>
          </div>
          <div className="p-3 border rounded-lg">
            <div className="font-semibold text-green-600">Cheapest: $280</div>
            <div className="text-muted-foreground">Score: 58 (Good)</div>
            <div className="text-xs mt-1">5+ days recovery</div>
          </div>
        </div>
      </div>
    );
  },
};

// Usage documentation
export const UsageGuidelines: Story = {
  render: () => (
    <div className="max-w-2xl space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Price vs Jetlag Chart</h2>
        <p className="text-muted-foreground">
          Interactive scatter plot showing the relationship between flight price and jetlag recovery score.
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Key Features</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>✓ Visualizes price-jetlag trade-off</li>
            <li>✓ Color-coded by flight category</li>
            <li>✓ Pareto frontier line shows optimal choices</li>
            <li>✓ Interactive hover states with price labels</li>
            <li>✓ Click handler for flight selection</li>
          </ul>
        </div>

        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Reading the Chart</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div><strong className="text-foreground">Top-left quadrant:</strong> Best options - high score, low price</div>
            <div><strong className="text-foreground">Bottom-right quadrant:</strong> Worst options - low score, high price</div>
            <div><strong className="text-foreground">Pareto frontier:</strong> Dashed line showing flights not dominated by any other</div>
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Categories</h3>
          <div className="flex flex-wrap gap-2 text-xs">
            <div className="px-2 py-1 rounded bg-purple-100 text-purple-800">Best Value</div>
            <div className="px-2 py-1 rounded bg-green-100 text-green-800">Cheapest</div>
            <div className="px-2 py-1 rounded bg-blue-100 text-blue-800">Best Jetlag</div>
            <div className="px-2 py-1 rounded bg-orange-100 text-orange-800">Balanced</div>
            <div className="px-2 py-1 rounded bg-gray-100 text-gray-800">Regular</div>
          </div>
        </div>

        <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
          <h3 className="font-semibold mb-2">Business Logic</h3>
          <p className="text-sm text-muted-foreground">
            The chart automatically calculates the Pareto frontier - the set of flights that
            are not dominated by any other flight on both dimensions. Flights on the frontier
            represent valid trade-offs where improving one dimension requires sacrificing the other.
          </p>
        </div>
      </div>
    </div>
  ),
};
