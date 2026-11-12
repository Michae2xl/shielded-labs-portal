import { isValidElement, type ReactElement, type ReactNode, type RefObject } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PortalNavigation from './portal-navigation';

const controls = vi.hoisted(() => ({ setOpen: vi.fn() }));
vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useState: () => [false, controls.setOpen],
  useRef: (value: unknown) => ({ current: value }),
  useEffect: () => {},
}));

type Element = ReactElement<{ children?: ReactNode; ref?: RefObject<HTMLInputElement | null>; onClick?: () => void; 'aria-label'?: string; href?: string }>;
function elements(node: ReactNode): Element[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!isValidElement(node)) return [];
  const element = node as Element;
  return [element, ...elements(element.props.children)];
}
afterEach(() => { vi.clearAllMocks(); vi.unstubAllGlobals(); });

describe('Sidebar search actions', () => {
  it('returns focus to the surviving search input after removing its Clear button', () => {
    const change = vi.fn();
    const focus = vi.fn();
    const tree = elements(PortalNavigation({ view: 'overview', onNavigate: () => {}, search: { query: 'Mark', onChange: change, results: [] } }));
    const input = tree.find(node => node.type === 'input' && node.props['aria-label'] === 'Search the portal')!;
    input.props.ref!.current = { focus } as unknown as HTMLInputElement;
    tree.find(node => node.props['aria-label'] === 'Clear search')!.props.onClick!();
    expect(change).toHaveBeenCalledWith('');
    expect(focus).toHaveBeenCalledOnce();
  });

  it('closes the mobile menu and focuses main after opening a search result', () => {
    const run = vi.fn();
    const focus = vi.fn();
    vi.stubGlobal('document', { getElementById: vi.fn(() => ({ focus })) });
    const tree = elements(PortalNavigation({ view: 'overview', onNavigate: () => {}, search: { query: 'Mark', onChange: () => {}, results: [{ title: 'Mark Henderson', kind: 'Team', run }] } }));
    const result = tree.find(node => node.type === 'button' && elements(node).some(child => child.type === 'span' && child.props.children === 'Mark Henderson'))!;
    result.props.onClick!();
    expect(controls.setOpen).toHaveBeenCalledWith(false);
    expect(run).toHaveBeenCalledOnce();
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  });
});

describe('Sidebar menu', () => {
  it('lists the Labs pages as one menu, with no governance entry and no brand block', () => {
    const tree = elements(PortalNavigation({ view: 'overview', onNavigate: () => {} }));
    const lists = tree.filter(node => node.type === 'ul');
    expect(lists).toHaveLength(1);
    // Governance is a portal of its own: this menu holds only the pages of this one.
    expect(elements(lists[0]).filter(node => node.type === 'a').map(node => node.props.href)).toEqual(
      ['overview', 'projects', 'impact', 'activity', 'people', 'blog', 'about'].map(view => `?view=${view}`));
    expect(tree.filter(node => node.type === 'a').some(node => String(node.props.href).includes('governance'))).toBe(false);
    expect(tree.some(node => node.props['aria-label'] === 'Shielded Labs overview')).toBe(false);
  });
});
