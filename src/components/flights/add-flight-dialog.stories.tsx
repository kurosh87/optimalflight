import type { Meta, StoryObj } from '@storybook/react';
import { AddFlightDialog } from './add-flight-dialog';
import { Toaster } from '@/components/ui/toaster';

const meta: Meta<typeof AddFlightDialog> = {
  title: 'Domain/Flights/AddFlightDialog',
  component: AddFlightDialog,
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
type Story = StoryObj<typeof AddFlightDialog>;

// Default dialog trigger
export const Default: Story = {
  args: {
    onFlightAdded: () => console.log('Flight added'),
  },
};

// With callback
export const WithCallback: Story = {
  args: {
    onFlightAdded: () => alert('Flight added successfully!'),
  },
};

// Usage in different contexts
export const InDashboard: Story = {
  render: (args) => (
    <div className="p-6 border rounded-lg max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">Your Flights</h2>
          <p className="text-sm text-muted-foreground">Manage your upcoming trips</p>
        </div>
        <AddFlightDialog {...args} />
      </div>
      <div className="text-sm text-muted-foreground text-center py-8">
        No flights yet. Click "Add Flight" to get started.
      </div>
    </div>
  ),
};

// In toolbar
export const InToolbar: Story = {
  render: (args) => (
    <div className="flex items-center justify-between p-4 border-b bg-background max-w-4xl">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold">Flight Search</h1>
        <div className="text-sm text-muted-foreground">3 results found</div>
      </div>
      <AddFlightDialog {...args} />
    </div>
  ),
};

// Usage guidelines
export const UsageGuidelines: Story = {
  render: () => (
    <div className="max-w-2xl space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Add Flight Dialog</h2>
        <p className="text-muted-foreground">
          Modal dialog for manually entering flight details to generate jetlag recovery plan.
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Form Fields</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div><strong className="text-foreground">Flight Information:</strong> Airline name, flight number (optional)</div>
            <div><strong className="text-foreground">Route:</strong> Origin and destination airports (required)</div>
            <div><strong className="text-foreground">Schedule:</strong> Departure and arrival date/time (required)</div>
            <div><strong className="text-foreground">Personal Factors:</strong> Sleep quality and adaptability overrides (optional)</div>
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Validation</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>✓ Validates airports exist in database</li>
            <li>✓ Calculates flight duration automatically</li>
            <li>✓ Checks departure is before arrival</li>
            <li>✓ Uses user preferences as defaults</li>
            <li>✓ Shows loading state during submission</li>
          </ul>
        </div>

        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">User Experience</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Airport select with searchable dropdown</li>
            <li>• Date/time pickers for easy input</li>
            <li>• Personal factor overrides for specific flights</li>
            <li>• Form resets after successful submission</li>
            <li>• Toast notifications for success/error</li>
          </ul>
        </div>

        <div className="mt-4">
          <AddFlightDialog onFlightAdded={() => console.log('Flight added')} />
        </div>
      </div>
    </div>
  ),
};
