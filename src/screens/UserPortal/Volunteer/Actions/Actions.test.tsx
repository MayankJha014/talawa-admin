import React, { act } from 'react';
import { MockedProvider } from '@apollo/react-testing';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import type { RenderResult } from '@testing-library/react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { store } from 'state/store';
import { StaticMockLink } from 'utils/StaticMockLink';
import i18n from 'utils/i18nForTest';
import Actions from './Actions';
import type { ApolloLink } from '@apollo/client';
import { MOCKS, EMPTY_MOCKS, ERROR_MOCKS } from './Actions.mocks';
import useLocalStorage from 'utils/useLocalstorage';
import { describe, it, beforeAll, beforeEach, afterAll, vi } from 'vitest';

const { setItem } = useLocalStorage();

const link1 = new StaticMockLink(MOCKS);
const link2 = new StaticMockLink(ERROR_MOCKS);
const link3 = new StaticMockLink(EMPTY_MOCKS);

const t = {
  ...JSON.parse(
    JSON.stringify(
      i18n.getDataByLanguage('en')?.translation.organizationActionItems ?? {},
    ),
  ),
  ...JSON.parse(JSON.stringify(i18n.getDataByLanguage('en')?.common ?? {})),
  ...JSON.parse(JSON.stringify(i18n.getDataByLanguage('en')?.errors ?? {})),
};

const debounceWait = async (ms = 300): Promise<void> => {
  await act(() => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  });
};

const renderActions = (link: ApolloLink): RenderResult => {
  return render(
    <MockedProvider addTypename={false} link={link}>
      <MemoryRouter initialEntries={['/user/volunteer/orgId']}>
        <Provider store={store}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <I18nextProvider i18n={i18n}>
              <Routes>
                <Route path="/user/volunteer/:orgId" element={<Actions />} />
                <Route
                  path="/"
                  element={<div data-testid="paramsError"></div>}
                />
              </Routes>
            </I18nextProvider>
          </LocalizationProvider>
        </Provider>
      </MemoryRouter>
    </MockedProvider>,
  );
};

describe('Testing Actions Screen', () => {
  beforeAll(() => {
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useNavigate: vi.fn(() => () => {}),
      };
    });
  });

  beforeEach(() => {
    setItem('userId', 'userId');
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('should redirect to fallback URL if URL params are undefined', async () => {
    setItem('userId', null);
    render(
      <MockedProvider addTypename={false} link={link1}>
        <MemoryRouter initialEntries={['/user/volunteer/']}>
          <Provider store={store}>
            <I18nextProvider i18n={i18n}>
              <Routes>
                <Route path="/user/volunteer/" element={<Actions />} />
                <Route
                  path="/"
                  element={<div data-testid="paramsError"></div>}
                />
              </Routes>
            </I18nextProvider>
          </Provider>
        </MemoryRouter>
      </MockedProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('paramsError')).toBeInTheDocument();
    });
  });

  it('should render Actions screen', async () => {
    renderActions(link1);
    await waitFor(async () => {
      const searchInput = await screen.findByTestId('searchBy');
      expect(searchInput).toBeInTheDocument();

      const assigneeName = await screen.findAllByTestId('assigneeName');
      expect(assigneeName[0]).toHaveTextContent('Teresa Bradley');
    });
  });

  it('Check Sorting Functionality', async () => {
    renderActions(link1);
    await waitFor(async () => {
      const searchInput = await screen.findByTestId('searchBy');
      expect(searchInput).toBeInTheDocument();

      let sortBtn = await screen.findByTestId('sort');
      expect(sortBtn).toBeInTheDocument();

      // Sort by dueDate_DESC
      fireEvent.click(sortBtn);
      const dueDateDESC = await screen.findByTestId('dueDate_DESC');
      expect(dueDateDESC).toBeInTheDocument();
      fireEvent.click(dueDateDESC);

      let assigneeName = await screen.findAllByTestId('assigneeName');
      expect(assigneeName[0]).toHaveTextContent('Group 1');

      // Sort by dueDate_ASC
      sortBtn = await screen.findByTestId('sort');
      expect(sortBtn).toBeInTheDocument();
      fireEvent.click(sortBtn);
      const dueDateASC = await screen.findByTestId('dueDate_ASC');
      expect(dueDateASC).toBeInTheDocument();
      fireEvent.click(dueDateASC);

      assigneeName = await screen.findAllByTestId('assigneeName');
      expect(assigneeName[0]).toHaveTextContent('Teresa Bradley');
    });
  });

  it('Search by Assignee name', async () => {
    renderActions(link1);
    await waitFor(async () => {
      const searchInput = await screen.findByTestId('searchBy');
      expect(searchInput).toBeInTheDocument();

      const searchToggle = await screen.findByTestId('searchByToggle');
      expect(searchToggle).toBeInTheDocument();
      userEvent.click(searchToggle);

      const searchByAssignee = await screen.findByTestId('assignee');
      expect(searchByAssignee).toBeInTheDocument();
      userEvent.click(searchByAssignee);

      userEvent.type(searchInput, '1');
    });
    await debounceWait();

    await waitFor(async () => {
      const assigneeName = await screen.findAllByTestId('assigneeName');
      expect(assigneeName[0]).toHaveTextContent('Group 1');
    });
  });

  it('Search by Category name', async () => {
    renderActions(link1);
    await waitFor(async () => {
      const searchInput = await screen.findByTestId('searchBy');
      expect(searchInput).toBeInTheDocument();

      const searchToggle = await screen.findByTestId('searchByToggle');
      expect(searchToggle).toBeInTheDocument();
      userEvent.click(searchToggle);

      const searchByCategory = await screen.findByTestId('category');
      expect(searchByCategory).toBeInTheDocument();
      userEvent.click(searchByCategory);

      userEvent.type(searchInput, '1');
    });
    await debounceWait();

    await waitFor(() => {
      const assigneeName = screen.getAllByTestId('assigneeName');
      expect(assigneeName[0]).toHaveTextContent('Teresa Bradley');
    });
  });

  it('should render screen with No Actions', async () => {
    renderActions(link3);

    await waitFor(() => {
      expect(screen.getByTestId('searchBy')).toBeInTheDocument();
      expect(screen.getByText(t.noActionItems)).toBeInTheDocument();
    });
  });

  it('Error while fetching Actions data', async () => {
    renderActions(link2);

    await waitFor(() => {
      expect(screen.getByTestId('errorMsg')).toBeInTheDocument();
    });
  });

  it('Open and close ItemUpdateStatusModal', async () => {
    renderActions(link1);

    const checkbox = await screen.findAllByTestId('statusCheckbox');
    userEvent.click(checkbox[0]);

    await waitFor(async () => {
      const element = await screen.findByText(t.actionItemStatus); // Resolve the promise
      expect(element).toBeInTheDocument(); // Now assert the resolved element
    });
    userEvent.click(await screen.findByTestId('modalCloseBtn'));
  });

  it('Open and close ItemViewModal', async () => {
    renderActions(link1);

    const viewItemBtn = await screen.findAllByTestId('viewItemBtn');
    userEvent.click(viewItemBtn[0]);

    await waitFor(() => {
      expect(screen.getByText(t.actionItemDetails)).toBeInTheDocument();
    });

    userEvent.click(await screen.findByTestId('modalCloseBtn'));
  });
});
