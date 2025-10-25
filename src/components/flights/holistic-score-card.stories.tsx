import type { Meta, StoryObj } from '@storybook/react';
import { HolisticScoreCard } from './holistic-score-card';

const meta: Meta<typeof HolisticScoreCard> = {
  title: 'Domain/Flights/HolisticScoreCard',
  component: HolisticScoreCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    compact: {
      control: 'boolean',
      description: 'Compact mode for Chrome extension (400x600px)',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof HolisticScoreCard>;

// Mock data
const mockFlight = {
  price: 450,
  currency: 'USD',
  stops: 0,
  duration: 420, // 7 hours
};

const optimalScore = {
  overallJetlagScore: 92,
  recommendation: 'Optimal',
  estimatedRecoveryDays: 1.5,
  circadianScore: 95,
  strategyScore: 88,
  comfortScore: 90,
  efficiencyScore: 92,
  strengths: [
    'Departs during optimal circadian window for eastward travel',
    'Arrives at 10am local time - perfect for quick adaptation',
    'Direct flight eliminates connection stress',
    'Premium aircraft with excellent sleep amenities',
  ],
  weaknesses: [],
  recommendations: [
    'Get morning sunlight immediately upon arrival',
    'Stay awake until 9pm local time on arrival day',
  ],
  scenarios: [
    { persona: 'Business Travelers', match: 95 },
    { persona: 'Frequent Flyers', match: 92 },
    { persona: 'Comfort Seekers', match: 88 },
  ],
};

const excellentScore = {
  overallJetlagScore: 78,
  recommendation: 'Excellent',
  estimatedRecoveryDays: 2.3,
  circadianScore: 82,
  strategyScore: 75,
  comfortScore: 76,
  efficiencyScore: 78,
  strengths: [
    'Good departure timing for circadian adaptation',
    'Reasonable arrival time (morning)',
    'Quality airline with sleep-friendly service',
  ],
  weaknesses: [
    'One connection adds slight stress',
    'Layover duration could be optimized',
  ],
  recommendations: [
    'Use layover time to adjust to new timezone',
    'Consider upgrading to business class for better sleep',
  ],
  scenarios: [
    { persona: 'Budget Travelers', match: 85 },
    { persona: 'Leisure Travelers', match: 78 },
  ],
};

const goodScore = {
  overallJetlagScore: 58,
  recommendation: 'Good',
  estimatedRecoveryDays: 3.5,
  circadianScore: 62,
  strategyScore: 55,
  comfortScore: 58,
  efficiencyScore: 57,
  strengths: [
    'Affordable price point',
    'Acceptable travel duration',
  ],
  weaknesses: [
    'Suboptimal departure time for circadian rhythm',
    'Evening arrival makes adaptation harder',
    'Multiple connections increase fatigue',
    'Older aircraft with limited sleep comfort',
  ],
  recommendations: [
    'Start adjusting sleep schedule 2 days before departure',
    'Use melatonin strategically during flight',
    'Book lounge access for layovers to rest',
    'Consider spending extra for better timing',
  ],
  scenarios: [
    { persona: 'Budget Conscious', match: 72 },
  ],
};

const challengingScore = {
  overallJetlagScore: 42,
  recommendation: 'Challenging',
  estimatedRecoveryDays: 5.2,
  circadianScore: 38,
  strategyScore: 45,
  comfortScore: 42,
  efficiencyScore: 44,
  strengths: [
    'Low price makes it economical',
  ],
  weaknesses: [
    'Red-eye departure conflicts with circadian rhythm',
    'Lands late evening - worst time for adaptation',
    '3 connections significantly increase travel stress',
    'Long layovers in non-optimal airports',
    'Basic aircraft with minimal sleep amenities',
  ],
  recommendations: [
    'Strongly consider alternative flights with better timing',
    'If booking, start pre-adaptation 3-4 days early',
    'Use strategic light therapy throughout journey',
    'Book airport hotel for mid-journey sleep',
    'Consider if cost savings justify 5+ day recovery',
  ],
  scenarios: [],
};

// Optimal flight (90+ score)
export const Optimal: Story = {
  args: {
    score: optimalScore,
    flight: mockFlight,
    priceCategory: {
      category: 'best-value',
      valueScore: 95,
    },
  },
};

// Excellent flight (75-89 score)
export const Excellent: Story = {
  args: {
    score: excellentScore,
    flight: {
      ...mockFlight,
      price: 380,
      stops: 1,
    },
    priceCategory: {
      category: 'balanced',
      valueScore: 82,
    },
  },
};

// Good flight (50-74 score)
export const Good: Story = {
  args: {
    score: goodScore,
    flight: {
      ...mockFlight,
      price: 280,
      stops: 2,
      duration: 720,
    },
    priceCategory: {
      category: 'cheapest',
      valueScore: 65,
      savingsFromBest: 170,
    },
  },
};

// Challenging flight (<50 score)
export const Challenging: Story = {
  args: {
    score: challengingScore,
    flight: {
      ...mockFlight,
      price: 220,
      stops: 3,
      duration: 960, // 16 hours
    },
  },
};

// Best jetlag option
export const BestJetlagOption: Story = {
  args: {
    score: optimalScore,
    flight: {
      ...mockFlight,
      price: 620,
    },
    priceCategory: {
      category: 'best-jetlag',
      valueScore: 98,
    },
  },
};

// Cheapest option
export const CheapestOption: Story = {
  args: {
    score: goodScore,
    flight: {
      ...mockFlight,
      price: 280,
      stops: 2,
    },
    priceCategory: {
      category: 'cheapest',
      valueScore: 58,
      savingsFromBest: 340,
    },
  },
};

// Best value option
export const BestValue: Story = {
  args: {
    score: excellentScore,
    flight: {
      ...mockFlight,
      price: 420,
      stops: 1,
    },
    priceCategory: {
      category: 'best-value',
      valueScore: 88,
    },
  },
};

// Compact view for Chrome extension
export const CompactView: Story = {
  args: {
    score: excellentScore,
    flight: mockFlight,
    compact: true,
  },
  globals: {
    viewport: {
      value: 'mobile',
      isRotated: false
    }
  },
};

// Without price category
export const NoPriceCategory: Story = {
  args: {
    score: excellentScore,
    flight: mockFlight,
  },
};

// High recovery days
export const LongRecovery: Story = {
  args: {
    score: {
      ...challengingScore,
      estimatedRecoveryDays: 7.5,
    },
    flight: {
      ...mockFlight,
      price: 220,
      stops: 3,
    },
  },
};

// Quick recovery
export const QuickRecovery: Story = {
  args: {
    score: {
      ...optimalScore,
      estimatedRecoveryDays: 1.2,
    },
    flight: {
      ...mockFlight,
      price: 550,
    },
    priceCategory: {
      category: 'best-jetlag',
      valueScore: 96,
    },
  },
};

// Comparison view
export const ComparisonView: Story = {
  render: () => (
    <div className="grid gap-4 max-w-4xl">
      <div>
        <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Best Jetlag</h3>
        <HolisticScoreCard
          score={optimalScore}
          flight={{ ...mockFlight, price: 620 }}
          priceCategory={{ category: 'best-jetlag', valueScore: 98 }}
        />
      </div>
      <div>
        <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Best Value</h3>
        <HolisticScoreCard
          score={excellentScore}
          flight={{ ...mockFlight, price: 420, stops: 1 }}
          priceCategory={{ category: 'best-value', valueScore: 88 }}
        />
      </div>
      <div>
        <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Cheapest</h3>
        <HolisticScoreCard
          score={goodScore}
          flight={{ ...mockFlight, price: 280, stops: 2 }}
          priceCategory={{ category: 'cheapest', valueScore: 58, savingsFromBest: 340 }}
        />
      </div>
    </div>
  ),
};

// Business logic documentation
export const ScoringExplanation: Story = {
  render: () => (
    <div className="max-w-3xl space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Holistic Jetlag Scoring System</h2>
        <p className="text-muted-foreground">
          Multi-dimensional assessment of flight's jetlag impact based on validated circadian science.
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">4 Dimensions</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div><strong className="text-foreground">Circadian (45%):</strong> Timing alignment with body clock</div>
            <div><strong className="text-foreground">Strategy (25%):</strong> Routing and airport facilities</div>
            <div><strong className="text-foreground">Comfort (20%):</strong> Aircraft and airline quality</div>
            <div><strong className="text-foreground">Efficiency (10%):</strong> Duration vs recovery trade-off</div>
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Score Interpretation</h3>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-16 text-green-600 font-semibold">80-100</span>
              <span className="text-muted-foreground">Optimal - Minimal jetlag impact</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-16 text-blue-600 font-semibold">65-79</span>
              <span className="text-muted-foreground">Excellent - Low jetlag impact</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-16 text-yellow-600 font-semibold">50-64</span>
              <span className="text-muted-foreground">Good - Moderate jetlag</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-16 text-orange-600 font-semibold">&lt;50</span>
              <span className="text-muted-foreground">Challenging - High jetlag</span>
            </div>
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Price Categories</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div><strong className="text-purple-600">Best Value:</strong> Optimal price-to-score ratio</div>
            <div><strong className="text-green-600">Cheapest:</strong> Lowest price option</div>
            <div><strong className="text-blue-600">Best Jetlag:</strong> Highest jetlag score</div>
            <div><strong className="text-gray-600">Balanced:</strong> Middle ground option</div>
          </div>
        </div>

        <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
          <h3 className="font-semibold mb-2">Scientific Foundation</h3>
          <p className="text-sm text-muted-foreground">
            Based on circadian research by Burgess & Eastman (2005), enhanced with
            GPT-5 intelligence for airport facilities, aircraft quality ratings, and
            personalized recovery protocols.
          </p>
        </div>
      </div>
    </div>
  ),
};
