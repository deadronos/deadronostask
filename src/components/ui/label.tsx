import * as React from 'react';

import { cn } from '@/lib/utils/cn';

type LabelProperties = React.LabelHTMLAttributes<HTMLLabelElement>;

const Label = React.forwardRef<HTMLLabelElement, LabelProperties>(
  ({ className, ...properties }, reference) => (
    // eslint-disable-next-line jsx-a11y/label-has-associated-control
    <label
      ref={reference}
      className={cn(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className,
      )}
      {...properties}
    />
  ),
);
Label.displayName = 'Label';

export { Label };
