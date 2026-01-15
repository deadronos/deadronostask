import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { SearchProvider, useSearch } from '@/components/search-context';
import { SearchBox } from '@/components/SearchBox';

function SearchStateProbe() {
  const { query } = useSearch();
  return <div data-testid="query">{query}</div>;
}

describe('search context', () => {
  it('updates query through SearchBox', async () => {
    const user = userEvent.setup();
    render(
      <SearchProvider>
        <SearchBox />
        <SearchStateProbe />
      </SearchProvider>,
    );

    const input = screen.getByLabelText('Search tasks');
    await user.type(input, 'roadmap');

    expect(screen.getByTestId('query')).toHaveTextContent('roadmap');
  });
});
