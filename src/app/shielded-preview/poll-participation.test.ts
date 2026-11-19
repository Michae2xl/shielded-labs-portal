import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { bodyMarks, NU7_1_PARTICIPATION } from '@/lib/shielded-preview/poll-turnout/participation';
import { NU7_1_TURNOUT } from '@/lib/shielded-preview/poll-turnout/turnout';
import PollParticipation from './poll-participation';

const markup = renderToStaticMarkup(createElement(PollParticipation));
const text = markup.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

describe('how to take part', () => {
  it('gives the ballots’ shared instructions, then one column per group that votes', () => {
    expect(text).toContain('How to participate Until 1 Dec, 02:59 UTC');
    expect(text).toContain('you may support more than one, even proposals that conflict');
    expect(text).toContain('a runoff poll may follow');
    expect(markup).toContain('id="how-to-take-part"');
    expect(text).toMatch(/Coinholders .*ZCAP members .*Community panels/);
  });
  it('sends coinholders to the three wallets the organizers named, and Zkool users to their post', () => {
    expect(text).toContain('Watch wallet tutorials');
    for (const site of ['https://vizor.cash', 'https://zodl.com', 'https://github.com/hhanh00/zkool2']) expect(markup).toContain(`href="${site}"`);
    expect(markup).toContain('href="https://forum.zcashcommunity.com/t/zcg-and-the-dev-fund-timeline-for-proposals-and-polling/58906/133"');
    // The settings link Zkool asks for, whole, in a field to copy: the one in post 133.
    expect(markup).toContain('value="https://voting.valargroup.dev/pins/prod/28fc9b631091ae8bc2f8635d8930489238ce144174cbd15a03efb0530b301ebe/v2-static-voting-config.json?checksum=sha256:28fc9b631091ae8bc2f8635d8930489238ce144174cbd15a03efb0530b301ebe"');
    expect(markup).toMatch(/<input [^>]*readOnly=""[^>]*aria-label="Zkool settings link"|<input [^>]*aria-label="Zkool settings link"[^>]*readOnly=""/);
    expect(text).toContain('Copy');
    expect(text).toContain('Mainnet block');
    expect(text).not.toContain('3,578,540');
    expect(text).toContain('They vote on Helios, with the voter ID and password it emails them.');
  });
  it('tells ZCAP members which email to look for and where to ask for help', () => {
    expect(text).toContain('Look for “ZCAP NU7.1 Poll” from election@siv.org , and check spam.');
    expect(markup).toContain('href="mailto:zcap-poll-help@zfnd.org"');
    expect(markup).toContain('href="https://forum.zcashcommunity.com/t/zcap-poll-now-open-nu7-1/59366"');
  });
  it('links each community panel’s Helios ballot, the same elections the turnout panel counts', () => {
    const helios = NU7_1_TURNOUT.sources.flatMap((source) => (source.kind === 'helios' ? [source.electionUuid] : []));
    expect(NU7_1_PARTICIPATION.panels.map((panel) => panel.ballot)).toEqual(helios.map((uuid) => `https://vote.heliosvoting.org/helios/elections/${uuid}/view`));
    expect(text).toContain('Zcash Brasil ballot');
    expect(text).toContain('ZecHub ballot');
  });
  it('opens every outside link in a new tab, and names each body as the turnout panel does', () => {
    const outside = markup.match(/<a [^>]*href="https:[^"]+"[^>]*>/g) ?? [];
    // Three wallets, the organizers' post and thread, the Zcash Foundation's post, two Helios ballots.
    expect(outside.length).toBe(8);
    expect(outside.every((tag) => tag.includes('target="_blank"') && tag.includes('rel="noopener noreferrer"'))).toBe(true);
    expect(bodyMarks('zcap').name).toBe('ZCAP');
    expect(() => bodyMarks('nobody')).toThrow();
  });
});
