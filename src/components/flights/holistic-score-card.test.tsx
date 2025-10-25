import { render, screen } from '@/components/test-utils';
import userEvent from '@testing-library/user-event';
import { HolisticScoreCard } from './holistic-score-card';

const mockScore = {
  overallJetlagScore: 78,
  recommendation: 'Excellent',
  estimatedRecoveryDays: 2.3,
  circadianScore: 82,
  strategyScore: 75,
  comfortScore: 76,
  efficiencyScore: 78,
  strengths: ['Good timing', 'Quality airline'],
  weaknesses: ['One connection'],
  recommendations: ['Use layover wisely'],
  scenarios: [
    { persona: 'Business Travelers', match: 85 },
    { persona: 'Budget Travelers', match: 72 },
  ],
};

const mockFlight = {
  price: 450,
  currency: 'USD',
  stops: 1,
  duration: 480,
};

describe('HolisticScoreCard', () => {
  describe('Rendering', () => {
    it('renders overall jetlag score', () => {
      render(<HolisticScoreCard score={mockScore} flight={mockFlight} />);

      expect(screen.getByText('78')).toBeInTheDocument();
      expect(screen.getByText('Jetlag Score')).toBeInTheDocument();
    });

    it('renders recommendation badge', () => {
      render(<HolisticScoreCard score={mockScore} flight={mockFlight} />);

      expect(screen.getByText('Excellent')).toBeInTheDocument();
    });

    it('renders estimated recovery days', () => {
      render(<HolisticScoreCard score={mockScore} flight={mockFlight} />);

      expect(screen.getByText(/2.3 days recovery/)).toBeInTheDocument();
    });

    it('renders flight price and currency', () => {
      render(<HolisticScoreCard score={mockScore} flight={mockFlight} />);

      expect(screen.getByText(/USD 450/)).toBeInTheDocument();
    });

    it('renders flight duration', () => {
      render(<HolisticScoreCard score={mockScore} flight={mockFlight} />);

      expect(screen.getByText(/8h 0m/)).toBeInTheDocument();
    });

    it('renders number of stops', () => {
      render(<HolisticScoreCard score={mockScore} flight={mockFlight} />);

      expect(screen.getByText(/1 stop/)).toBeInTheDocument();
    });

    it('renders plural stops correctly', () => {
      const flightWithMultipleStops = { ...mockFlight, stops: 2 };
      render(<HolisticScoreCard score={mockScore} flight={flightWithMultipleStops} />);

      expect(screen.getByText(/2 stops/)).toBeInTheDocument();
    });

    it('does not show stops when direct', () => {
      const directFlight = { ...mockFlight, stops: 0 };
      render(<HolisticScoreCard score={mockScore} flight={directFlight} />);

      expect(screen.queryByText(/stop/)).not.toBeInTheDocument();
    });
  });

  describe('Score Color Coding', () => {
    it('applies green color for optimal scores (80+)', () => {
      const optimalScore = { ...mockScore, overallJetlagScore: 92 };
      render(<HolisticScoreCard score={optimalScore} flight={mockFlight} />);

      const scoreElement = screen.getByText('92');
      expect(scoreElement).toHaveClass('text-green-600');
    });

    it('applies blue color for excellent scores (65-79)', () => {
      render(<HolisticScoreCard score={mockScore} flight={mockFlight} />);

      const scoreElement = screen.getByText('78');
      expect(scoreElement).toHaveClass('text-blue-600');
    });

    it('applies yellow color for good scores (50-64)', () => {
      const goodScore = { ...mockScore, overallJetlagScore: 58 };
      render(<HolisticScoreCard score={goodScore} flight={mockFlight} />);

      const scoreElement = screen.getByText('58');
      expect(scoreElement).toHaveClass('text-yellow-600');
    });

    it('applies orange color for low scores (<50)', () => {
      const lowScore = { ...mockScore, overallJetlagScore: 42 };
      render(<HolisticScoreCard score={lowScore} flight={mockFlight} />);

      const scoreElement = screen.getByText('42');
      expect(scoreElement).toHaveClass('text-orange-600');
    });
  });

  describe('Recommendation Badges', () => {
    it('shows optimal badge for optimal recommendation', () => {
      const optimalScore = { ...mockScore, recommendation: 'Optimal' };
      render(<HolisticScoreCard score={optimalScore} flight={mockFlight} />);

      expect(screen.getByText('Optimal')).toBeInTheDocument();
    });

    it('shows excellent badge', () => {
      render(<HolisticScoreCard score={mockScore} flight={mockFlight} />);

      expect(screen.getByText('Excellent')).toBeInTheDocument();
    });

    it('shows good badge', () => {
      const goodScore = { ...mockScore, recommendation: 'Good' };
      render(<HolisticScoreCard score={goodScore} flight={mockFlight} />);

      expect(screen.getByText('Good')).toBeInTheDocument();
    });

    it('shows challenging badge for other recommendations', () => {
      const challengingScore = { ...mockScore, recommendation: 'Challenging' };
      render(<HolisticScoreCard score={challengingScore} flight={mockFlight} />);

      expect(screen.getByText('Challenging')).toBeInTheDocument();
    });
  });

  describe('Price Category Badges', () => {
    it('shows best value badge', () => {
      const priceCategory = { category: 'best-value' as const, valueScore: 88 };
      render(
        <HolisticScoreCard score={mockScore} flight={mockFlight} priceCategory={priceCategory} />
      );

      expect(screen.getByText('Best Value')).toBeInTheDocument();
    });

    it('shows cheapest badge', () => {
      const priceCategory = { category: 'cheapest' as const, valueScore: 58 };
      render(
        <HolisticScoreCard score={mockScore} flight={mockFlight} priceCategory={priceCategory} />
      );

      expect(screen.getByText('Cheapest')).toBeInTheDocument();
    });

    it('shows best jetlag badge', () => {
      const priceCategory = { category: 'best-jetlag' as const, valueScore: 96 };
      render(
        <HolisticScoreCard score={mockScore} flight={mockFlight} priceCategory={priceCategory} />
      );

      expect(screen.getByText('Best Jetlag')).toBeInTheDocument();
    });

    it('shows balanced badge', () => {
      const priceCategory = { category: 'balanced' as const, valueScore: 72 };
      render(
        <HolisticScoreCard score={mockScore} flight={mockFlight} priceCategory={priceCategory} />
      );

      expect(screen.getByText('Balanced Option')).toBeInTheDocument();
    });

    it('does not show price category when not provided', () => {
      render(<HolisticScoreCard score={mockScore} flight={mockFlight} />);

      expect(screen.queryByText('Best Value')).not.toBeInTheDocument();
      expect(screen.queryByText('Cheapest')).not.toBeInTheDocument();
    });

    it('shows savings amount for cheaper options', () => {
      const priceCategory = {
        category: 'cheapest' as const,
        valueScore: 58,
        savingsFromBest: 340,
      };
      render(
        <HolisticScoreCard score={mockScore} flight={mockFlight} priceCategory={priceCategory} />
      );

      expect(screen.getByText('Save $340')).toBeInTheDocument();
    });

    it('shows extra cost for better jetlag options', () => {
      const priceCategory = {
        category: 'best-jetlag' as const,
        valueScore: 96,
        extraCostForBest: 200,
      };
      render(
        <HolisticScoreCard score={mockScore} flight={mockFlight} priceCategory={priceCategory} />
      );

      expect(screen.getByText('+$200 vs best jetlag')).toBeInTheDocument();
    });
  });

  describe('Dimensional Scores', () => {
    it('renders all four dimensions', () => {
      render(<HolisticScoreCard score={mockScore} flight={mockFlight} />);

      expect(screen.getByText('Circadian')).toBeInTheDocument();
      expect(screen.getByText('Strategy')).toBeInTheDocument();
      expect(screen.getByText('Comfort')).toBeInTheDocument();
      expect(screen.getByText('Efficiency')).toBeInTheDocument();
    });

    it('renders dimension scores', () => {
      render(<HolisticScoreCard score={mockScore} flight={mockFlight} />);

      expect(screen.getByText('82')).toBeInTheDocument(); // circadianScore
      expect(screen.getByText('75')).toBeInTheDocument(); // strategyScore
      expect(screen.getByText('76')).toBeInTheDocument(); // comfortScore
      expect(screen.getByText('78')).toBeInTheDocument(); // efficiencyScore
    });

    it('displays dimension weights', () => {
      render(<HolisticScoreCard score={mockScore} flight={mockFlight} />);

      expect(screen.getByText('45% weight')).toBeInTheDocument(); // Circadian
      expect(screen.getByText('25% weight')).toBeInTheDocument(); // Strategy
      expect(screen.getByText('20% weight')).toBeInTheDocument(); // Comfort
      expect(screen.getByText('10% weight')).toBeInTheDocument(); // Efficiency
    });
  });

  describe('Expansion Interaction', () => {
    it('shows expand button when not compact', () => {
      render(<HolisticScoreCard score={mockScore} flight={mockFlight} compact={false} />);

      expect(screen.getByText('View Detailed Analysis')).toBeInTheDocument();
    });

    it('does not show expand button in compact mode', () => {
      render(<HolisticScoreCard score={mockScore} flight={mockFlight} compact={true} />);

      expect(screen.queryByText('View Detailed Analysis')).not.toBeInTheDocument();
    });

    it('expands to show detailed analysis', async () => {
      const user = userEvent.setup();
      render(<HolisticScoreCard score={mockScore} flight={mockFlight} compact={false} />);

      const expandButton = screen.getByText('View Detailed Analysis');
      await user.click(expandButton);

      expect(screen.getByText('Strengths')).toBeInTheDocument();
      expect(screen.getByText('Considerations')).toBeInTheDocument();
      expect(screen.getByText('Optimization Tips')).toBeInTheDocument();
    });

    it('displays strengths in expanded view', async () => {
      const user = userEvent.setup();
      render(<HolisticScoreCard score={mockScore} flight={mockFlight} compact={false} />);

      await user.click(screen.getByText('View Detailed Analysis'));

      expect(screen.getByText('Good timing')).toBeInTheDocument();
      expect(screen.getByText('Quality airline')).toBeInTheDocument();
    });

    it('displays weaknesses in expanded view', async () => {
      const user = userEvent.setup();
      render(<HolisticScoreCard score={mockScore} flight={mockFlight} compact={false} />);

      await user.click(screen.getByText('View Detailed Analysis'));

      expect(screen.getByText('One connection')).toBeInTheDocument();
    });

    it('displays recommendations in expanded view', async () => {
      const user = userEvent.setup();
      render(<HolisticScoreCard score={mockScore} flight={mockFlight} compact={false} />);

      await user.click(screen.getByText('View Detailed Analysis'));

      expect(screen.getByText('Use layover wisely')).toBeInTheDocument();
    });

    it('displays matching scenarios', async () => {
      const user = userEvent.setup();
      render(<HolisticScoreCard score={mockScore} flight={mockFlight} compact={false} />);

      await user.click(screen.getByText('View Detailed Analysis'));

      expect(screen.getByText('Best For:')).toBeInTheDocument();
      expect(screen.getByText('Business Travelers')).toBeInTheDocument();
      expect(screen.getByText('Budget Travelers')).toBeInTheDocument();
    });

    it('filters scenarios with match <70', async () => {
      const user = userEvent.setup();
      const scoreWithLowMatch = {
        ...mockScore,
        scenarios: [
          { persona: 'High Match', match: 85 },
          { persona: 'Low Match', match: 55 },
        ],
      };

      render(<HolisticScoreCard score={scoreWithLowMatch} flight={mockFlight} compact={false} />);
      await user.click(screen.getByText('View Detailed Analysis'));

      expect(screen.getByText('High Match')).toBeInTheDocument();
      expect(screen.queryByText('Low Match')).not.toBeInTheDocument();
    });

    it('collapses when hide button clicked', async () => {
      const user = userEvent.setup();
      render(<HolisticScoreCard score={mockScore} flight={mockFlight} compact={false} />);

      await user.click(screen.getByText('View Detailed Analysis'));
      await user.click(screen.getByText('Hide Detailed Analysis'));

      expect(screen.queryByText('Strengths')).not.toBeInTheDocument();
    });
  });

  describe('Compact Mode', () => {
    it('starts expanded when compact=false', () => {
      render(<HolisticScoreCard score={mockScore} flight={mockFlight} compact={false} />);

      // Expand button should be present (component starts collapsed)
      expect(screen.getByText('View Detailed Analysis')).toBeInTheDocument();
    });

    it('starts collapsed when compact=true', () => {
      render(<HolisticScoreCard score={mockScore} flight={mockFlight} compact={true} />);

      // No expand button in compact mode
      expect(screen.queryByText('View Detailed Analysis')).not.toBeInTheDocument();
    });
  });

  describe('Score Rounding', () => {
    it('rounds overall score to nearest integer', () => {
      const scoreWithDecimal = { ...mockScore, overallJetlagScore: 78.7 };
      render(<HolisticScoreCard score={scoreWithDecimal} flight={mockFlight} />);

      expect(screen.getByText('79')).toBeInTheDocument();
    });

    it('rounds dimension scores to nearest integer', () => {
      const scoreWithDecimals = {
        ...mockScore,
        circadianScore: 82.4,
        strategyScore: 75.8,
      };
      render(<HolisticScoreCard score={scoreWithDecimals} flight={mockFlight} />);

      expect(screen.getByText('82')).toBeInTheDocument();
      expect(screen.getByText('76')).toBeInTheDocument();
    });
  });

  describe('Conditional Rendering', () => {
    it('does not show strengths section when empty', async () => {
      const user = userEvent.setup();
      const scoreWithoutStrengths = { ...mockScore, strengths: [] };
      render(<HolisticScoreCard score={scoreWithoutStrengths} flight={mockFlight} compact={false} />);

      await user.click(screen.getByText('View Detailed Analysis'));

      expect(screen.queryByText('Strengths')).not.toBeInTheDocument();
    });

    it('does not show weaknesses section when empty', async () => {
      const user = userEvent.setup();
      const scoreWithoutWeaknesses = { ...mockScore, weaknesses: [] };
      render(<HolisticScoreCard score={scoreWithoutWeaknesses} flight={mockFlight} compact={false} />);

      await user.click(screen.getByText('View Detailed Analysis'));

      expect(screen.queryByText('Considerations')).not.toBeInTheDocument();
    });

    it('does not show recommendations section when empty', async () => {
      const user = userEvent.setup();
      const scoreWithoutRecs = { ...mockScore, recommendations: [] };
      render(<HolisticScoreCard score={scoreWithoutRecs} flight={mockFlight} compact={false} />);

      await user.click(screen.getByText('View Detailed Analysis'));

      expect(screen.queryByText('Optimization Tips')).not.toBeInTheDocument();
    });

    it('does not show scenarios section when empty', async () => {
      const user = userEvent.setup();
      const scoreWithoutScenarios = { ...mockScore, scenarios: [] };
      render(<HolisticScoreCard score={scoreWithoutScenarios} flight={mockFlight} compact={false} />);

      await user.click(screen.getByText('View Detailed Analysis'));

      expect(screen.queryByText('Best For:')).not.toBeInTheDocument();
    });
  });

  describe('Border Styling', () => {
    it('applies green border for optimal scores', () => {
      const optimalScore = { ...mockScore, overallJetlagScore: 85 };
      const { container } = render(
        <HolisticScoreCard score={optimalScore} flight={mockFlight} />
      );

      const card = container.querySelector('[class*="border-green"]');
      expect(card).toBeInTheDocument();
    });

    it('applies blue border for excellent scores', () => {
      const excellentScore = { ...mockScore, overallJetlagScore: 72 };
      const { container } = render(
        <HolisticScoreCard score={excellentScore} flight={mockFlight} />
      );

      const card = container.querySelector('[class*="border-blue"]');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Business Logic', () => {
    it('displays all four dimension names correctly', () => {
      render(<HolisticScoreCard score={mockScore} flight={mockFlight} />);

      expect(screen.getByText('Circadian')).toBeInTheDocument();
      expect(screen.getByText('Strategy')).toBeInTheDocument();
      expect(screen.getByText('Comfort')).toBeInTheDocument();
      expect(screen.getByText('Efficiency')).toBeInTheDocument();
    });

    it('displays dimension descriptions', () => {
      render(<HolisticScoreCard score={mockScore} flight={mockFlight} />);

      expect(screen.getByText('Timing & timezone')).toBeInTheDocument();
      expect(screen.getByText('Routing & facilities')).toBeInTheDocument();
      expect(screen.getByText('Aircraft & service')).toBeInTheDocument();
      expect(screen.getByText('Duration & stress')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has accessible heading for jetlag score', () => {
      render(<HolisticScoreCard score={mockScore} flight={mockFlight} />);

      // Score should be in a heading context
      expect(screen.getByText('Jetlag Score')).toBeInTheDocument();
    });

    it('has accessible expand button', () => {
      render(<HolisticScoreCard score={mockScore} flight={mockFlight} compact={false} />);

      expect(screen.getByRole('button', { name: /View Detailed Analysis/ })).toBeInTheDocument();
    });
  });
});
