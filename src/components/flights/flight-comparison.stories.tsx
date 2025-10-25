import type { Meta, StoryObj } from '@storybook/react';
import { FlightComparison } from './flight-comparison';

const meta: Meta<typeof FlightComparison> = {
  title: 'Domain/Flights/FlightComparison',
  component: FlightComparison,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FlightComparison>;

// Sample comparison data
const createFlight = (overrides: any = {}) => ({
  flight: {
    id: '1',
    origin: 'JFK',
    destination: 'LHR',
    price: 450,
    currency: 'USD',
    duration: 420,
    stops: 0,
    departureTime: '2025-11-15T22:00:00Z',
    arrivalTime: '2025-11-16T10:00:00Z',
    ...overrides.flight,
  },
  score: {
    overallJetlagScore: 78,
    recommendation: 'Excellent',
    estimatedRecoveryDays: 2.3,
    circadianScore: 82,
    strategyScore: 75,
    comfortScore: 76,
    efficiencyScore: 78,
    strengths: ['Good timing', 'Direct flight'],
    weaknesses: ['Evening departure'],
    ...overrides.score,
  },
  priceCategory: overrides.priceCategory,
});

// Two flights comparison
export const TwoFlights: Story = {
  args: {
    flights: [
      createFlight({
        flight: { id: '1', price: 450, stops: 0 },
        score: { overallJetlagScore: 78, estimatedRecoveryDays: 2.3 },
        priceCategory: { category: 'best-value' },
      }),
      createFlight({
        flight: { id: '2', price: 280, stops: 2, duration: 720 },
        score: { overallJetlagScore: 58, estimatedRecoveryDays: 3.8 },
        priceCategory: { category: 'cheapest' },
      }),
    ],
  },
};

// Three flights comparison (optimal vs balanced vs budget)
export const ThreeFlights: Story = {
  args: {
    flights: [
      createFlight({
        flight: { id: '1', price: 620, stops: 0, duration: 420 },
        score: {
          overallJetlagScore: 92,
          estimatedRecoveryDays: 1.5,
          recommendation: 'Optimal',
          circadianScore: 95,
          strategyScore: 88,
          comfortScore: 90,
          efficiencyScore: 92,
          strengths: ['Perfect timing', 'Direct flight', 'Premium aircraft'],
          weaknesses: [],
        },
        priceCategory: { category: 'best-jetlag' },
      }),
      createFlight({
        flight: { id: '2', price: 450, stops: 1, duration: 540 },
        score: {
          overallJetlagScore: 78,
          estimatedRecoveryDays: 2.3,
          recommendation: 'Excellent',
          strengths: ['Good timing', 'Quality layover'],
          weaknesses: ['One connection'],
        },
        priceCategory: { category: 'best-value' },
      }),
      createFlight({
        flight: { id: '3', price: 280, stops: 2, duration: 720 },
        score: {
          overallJetlagScore: 58,
          estimatedRecoveryDays: 3.8,
          recommendation: 'Good',
          circadianScore: 62,
          strategyScore: 55,
          comfortScore: 58,
          efficiencyScore: 57,
          strengths: ['Affordable'],
          weaknesses: ['Suboptimal timing', 'Two connections', 'Long duration'],
        },
        priceCategory: { category: 'cheapest' },
      }),
    ],
  },
};

// Empty state
export const Empty: Story = {
  args: {
    flights: [],
  },
};

// Single flight
export const SingleFlight: Story = {
  args: {
    flights: [
      createFlight({
        priceCategory: { category: 'best-jetlag' },
      }),
    ],
  },
};

// With remove handler
export const WithRemoveHandler: Story = {
  args: {
    flights: [
      createFlight({ flight: { id: '1' } }),
      createFlight({ flight: { id: '2' } }),
    ],
    onRemoveFlight: (id: string) => alert(`Remove flight: ${id}`),
  },
};

// Close scores (hard to choose)
export const CloseScores: Story = {
  args: {
    flights: [
      createFlight({
        flight: { id: '1', price: 450 },
        score: { overallJetlagScore: 78, estimatedRecoveryDays: 2.3 },
      }),
      createFlight({
        flight: { id: '2', price: 420 },
        score: { overallJetlagScore: 76, estimatedRecoveryDays: 2.5 },
      }),
      createFlight({
        flight: { id: '3', price: 480 },
        score: { overallJetlagScore: 80, estimatedRecoveryDays: 2.1 },
      }),
    ],
  },
};

// Wide variation
export const WideVariation: Story = {
  args: {
    flights: [
      createFlight({
        flight: { id: '1', price: 220, stops: 3, duration: 960 },
        score: {
          overallJetlagScore: 42,
          estimatedRecoveryDays: 5.2,
          recommendation: 'Challenging',
          strengths: ['Very cheap'],
          weaknesses: ['Poor timing', 'Many connections', 'Long journey'],
        },
      }),
      createFlight({
        flight: { id: '2', price: 620, stops: 0, duration: 400 },
        score: {
          overallJetlagScore: 92,
          estimatedRecoveryDays: 1.5,
          recommendation: 'Optimal',
          strengths: ['Perfect timing', 'Direct', 'Premium'],
          weaknesses: [],
        },
        priceCategory: { category: 'best-jetlag' },
      }),
    ],
  },
};

// Mobile view
export const MobileView: Story = {
  args: {
    flights: [
      createFlight({ flight: { id: '1' } }),
      createFlight({ flight: { id: '2' } }),
    ],
  },
  globals: {
    viewport: {
      value: 'mobile',
      isRotated: false
    }
  },
};

// Usage documentation
export const UsageGuidelines: Story = {
  render: () => (
    <div className="max-w-3xl space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Flight Comparison Component</h2>
        <p className="text-muted-foreground">
          Side-by-side comparison of up to 3 flights showing jetlag scores, prices, and trade-offs.
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Key Features</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>✓ Side-by-side layout for easy scanning</li>
            <li>✓ Best values highlighted with green checkmarks</li>
            <li>✓ Price category badges (best value, cheapest, best jetlag)</li>
            <li>✓ 4-dimensional score breakdown per flight</li>
            <li>✓ Strengths & weaknesses comparison</li>
            <li>✓ Quick comparison summary at bottom</li>
            <li>✓ Remove flights from comparison</li>
          </ul>
        </div>

        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">What Gets Highlighted</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div><strong className="text-green-600">✓ Lowest price</strong> - Green checkmark and color</div>
            <div><strong className="text-green-600">✓ Best jetlag score</strong> - Highlighted in green</div>
            <div><strong className="text-green-600">✓ Shortest duration</strong> - Best travel time</div>
            <div><strong className="text-green-600">✓ Fastest recovery</strong> - Fewest recovery days</div>
          </div>
        </div>

        <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
          <h3 className="font-semibold mb-2">Use Cases</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Compare shortlisted flights before booking</li>
            <li>• Visualize price vs jetlag trade-offs</li>
            <li>• See which flight wins on each dimension</li>
            <li>• Make informed booking decisions</li>
          </ul>
        </div>
      </div>
    </div>
  ),
};
