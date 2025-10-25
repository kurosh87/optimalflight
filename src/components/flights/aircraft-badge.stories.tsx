import type { Meta, StoryObj } from '@storybook/react';
import { AircraftBadge, AircraftInline } from './aircraft-badge';

const meta: Meta<typeof AircraftBadge> = {
  title: 'Domain/Flights/AircraftBadge',
  component: AircraftBadge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AircraftBadge>;

// Default aircraft
export const Default: Story = {
  args: {
    iataCode: '738',
    name: 'Boeing 737-800',
  },
};

// Next-gen aircraft (787, A350, A220)
export const NextGenDreamliner: Story = {
  args: {
    iataCode: '787',
    name: 'Boeing 787-9 Dreamliner',
    sleepScore: 9,
    isNextGen: true,
    seatComfort: 8,
    cabinPressure: 6000,
  },
};

export const NextGenA350: Story = {
  args: {
    iataCode: '359',
    name: 'Airbus A350-900',
    sleepScore: 9,
    isNextGen: true,
    seatComfort: 8,
    cabinPressure: 6000,
  },
};

export const NextGenA220: Story = {
  args: {
    iataCode: '223',
    name: 'Airbus A220-300',
    sleepScore: 8,
    isNextGen: true,
    seatComfort: 7,
    cabinPressure: 6500,
  },
};

// High sleep score
export const HighSleepScore: Story = {
  args: {
    iataCode: '77W',
    name: 'Boeing 777-300ER',
    sleepScore: 8,
    seatComfort: 7,
    cabinPressure: 7500,
  },
};

// Medium sleep score
export const MediumSleepScore: Story = {
  args: {
    iataCode: '320',
    name: 'Airbus A320',
    sleepScore: 6,
    seatComfort: 5,
    cabinPressure: 8000,
  },
};

// Low sleep score
export const LowSleepScore: Story = {
  args: {
    iataCode: '738',
    name: 'Boeing 737-800',
    sleepScore: 5,
    seatComfort: 4,
    cabinPressure: 8000,
  },
};

// Different sizes
export const SmallSize: Story = {
  args: {
    iataCode: '787',
    name: 'Boeing 787-9',
    sleepScore: 9,
    isNextGen: true,
    size: 'sm',
  },
};

export const MediumSize: Story = {
  args: {
    iataCode: '787',
    name: 'Boeing 787-9',
    sleepScore: 9,
    isNextGen: true,
    size: 'md',
  },
};

export const LargeSize: Story = {
  args: {
    iataCode: '787',
    name: 'Boeing 787-9',
    sleepScore: 9,
    isNextGen: true,
    size: 'lg',
  },
};

// Minimal info
export const MinimalInfo: Story = {
  args: {
    iataCode: '738',
  },
};

// All variants showcase
export const AllAircraftTypes: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-semibold mb-2">Next-Gen Aircraft</h4>
        <div className="flex gap-2 flex-wrap">
          <AircraftBadge iataCode="787" name="Boeing 787" sleepScore={9} isNextGen />
          <AircraftBadge iataCode="359" name="Airbus A350" sleepScore={9} isNextGen />
          <AircraftBadge iataCode="223" name="Airbus A220" sleepScore={8} isNextGen />
        </div>
      </div>
      <div>
        <h4 className="text-sm font-semibold mb-2">Wide-Body</h4>
        <div className="flex gap-2 flex-wrap">
          <AircraftBadge iataCode="77W" name="Boeing 777-300ER" sleepScore={8} />
          <AircraftBadge iataCode="388" name="Airbus A380" sleepScore={7} />
          <AircraftBadge iataCode="333" name="Airbus A330-300" sleepScore={7} />
        </div>
      </div>
      <div>
        <h4 className="text-sm font-semibold mb-2">Narrow-Body</h4>
        <div className="flex gap-2 flex-wrap">
          <AircraftBadge iataCode="321" name="Airbus A321" sleepScore={6} />
          <AircraftBadge iataCode="738" name="Boeing 737-800" sleepScore={5} />
          <AircraftBadge iataCode="320" name="Airbus A320" sleepScore={6} />
        </div>
      </div>
    </div>
  ),
};

// Inline variant
export const InlineDisplay: Story = {
  render: () => (
    <div className="space-y-3 max-w-md p-4 border rounded-lg">
      <p className="text-sm text-muted-foreground">Flight operated by:</p>
      <AircraftInline iataCode="787" name="Boeing 787-9 Dreamliner" sleepScore={9} isNextGen />
    </div>
  ),
};
