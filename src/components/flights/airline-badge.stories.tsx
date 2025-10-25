import type { Meta, StoryObj } from '@storybook/react';
import { AirlineBadge, AirlineInline } from './airline-badge';

const meta: Meta<typeof AirlineBadge> = {
  title: 'Domain/Flights/AirlineBadge',
  component: AirlineBadge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AirlineBadge>;

// Default airline
export const Default: Story = {
  args: {
    iataCode: 'BA',
    name: 'British Airways',
  },
};

// Premium airline with circadian lighting
export const PremiumWithCircadianLighting: Story = {
  args: {
    iataCode: 'EK',
    name: 'Emirates',
    serviceQuality: 9,
    lightingProtocols: 'circadian-optimized',
    mealQuality: 9,
    isLegacyCarrier: true,
  },
};

export const QatarAirways: Story = {
  args: {
    iataCode: 'QR',
    name: 'Qatar Airways',
    serviceQuality: 9,
    lightingProtocols: 'circadian-optimized',
    mealQuality: 9,
    isLegacyCarrier: true,
  },
};

export const SingaporeAirlines: Story = {
  args: {
    iataCode: 'SQ',
    name: 'Singapore Airlines',
    serviceQuality: 10,
    lightingProtocols: 'circadian-optimized',
    mealQuality: 10,
    isLegacyCarrier: true,
  },
};

// High quality airlines
export const HighQuality: Story = {
  args: {
    iataCode: 'NH',
    name: 'ANA',
    serviceQuality: 8,
    lightingProtocols: 'manual-dimming',
    mealQuality: 8,
  },
};

// Medium quality airlines
export const MediumQuality: Story = {
  args: {
    iataCode: 'UA',
    name: 'United Airlines',
    serviceQuality: 6,
    lightingProtocols: 'basic',
    mealQuality: 6,
    isLegacyCarrier: true,
  },
};

// Basic airlines
export const BasicAirline: Story = {
  args: {
    iataCode: 'NK',
    name: 'Spirit Airlines',
    serviceQuality: 4,
    lightingProtocols: 'basic',
    mealQuality: 3,
  },
};

// Without lighting info
export const WithoutLighting: Story = {
  args: {
    iataCode: 'AA',
    name: 'American Airlines',
    serviceQuality: 7,
    mealQuality: 7,
    isLegacyCarrier: true,
  },
};

// Different sizes
export const SmallSize: Story = {
  args: {
    iataCode: 'EK',
    name: 'Emirates',
    serviceQuality: 9,
    lightingProtocols: 'circadian-optimized',
    size: 'sm',
  },
};

export const MediumSize: Story = {
  args: {
    iataCode: 'EK',
    name: 'Emirates',
    serviceQuality: 9,
    lightingProtocols: 'circadian-optimized',
    size: 'md',
  },
};

export const LargeSize: Story = {
  args: {
    iataCode: 'EK',
    name: 'Emirates',
    serviceQuality: 9,
    lightingProtocols: 'circadian-optimized',
    size: 'lg',
  },
};

// Minimal info
export const MinimalInfo: Story = {
  args: {
    iataCode: 'BA',
  },
};

// All service quality levels
export const AllServiceQualityLevels: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-semibold mb-2">Premium (8-10)</h4>
        <div className="flex gap-2 flex-wrap">
          <AirlineBadge iataCode="SQ" name="Singapore Airlines" serviceQuality={10} lightingProtocols="circadian-optimized" />
          <AirlineBadge iataCode="EK" name="Emirates" serviceQuality={9} lightingProtocols="circadian-optimized" />
          <AirlineBadge iataCode="QR" name="Qatar Airways" serviceQuality={9} lightingProtocols="circadian-optimized" />
        </div>
      </div>
      <div>
        <h4 className="text-sm font-semibold mb-2">Good (6-7)</h4>
        <div className="flex gap-2 flex-wrap">
          <AirlineBadge iataCode="AA" name="American Airlines" serviceQuality={7} />
          <AirlineBadge iataCode="UA" name="United" serviceQuality={6} />
          <AirlineBadge iataCode="DL" name="Delta" serviceQuality={7} />
        </div>
      </div>
      <div>
        <h4 className="text-sm font-semibold mb-2">Basic (&lt;6)</h4>
        <div className="flex gap-2 flex-wrap">
          <AirlineBadge iataCode="NK" name="Spirit" serviceQuality={4} />
          <AirlineBadge iataCode="F9" name="Frontier" serviceQuality={4} />
        </div>
      </div>
    </div>
  ),
};

// Inline variant
export const InlineDisplay: Story = {
  render: () => (
    <div className="space-y-3 max-w-md p-4 border rounded-lg">
      <p className="text-sm text-muted-foreground">Operated by:</p>
      <AirlineInline
        iataCode="EK"
        name="Emirates"
        serviceQuality={9}
        lightingProtocols="circadian-optimized"
      />
    </div>
  ),
};
