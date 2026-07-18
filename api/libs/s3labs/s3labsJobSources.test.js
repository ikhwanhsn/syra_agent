/**
 * web3.career HTML parser — Run: node --test api/libs/s3labs/s3labsJobSources.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseWeb3CareerJobs } from "./s3labsJobSources.js";

const SAMPLE_HTML = `
<tbody class=tbody>
  <tr data-jobid=151471 onclick="tableTurboRowClick(event, '/junior-crypto-trader-remote-atom-partners/151471')" class="job-row-grid">
    <td data-jobid=151471 class=cell-main>
      <a href="/junior-crypto-trader-remote-atom-partners/151471">
        <h2 data-jobid=151471> Junior Crypto Trader (Remote) </h2>
      </a>
      <a href="/junior-crypto-trader-remote-atom-partners/151471">
        <h3 data-jobid=151471> Atom Partners </h3>
      </a>
      <span class=job-location-mobile><span class=job-loc-pin>*</span>Remote Europe </span>
    </td>
    <td class="cell-posted"><time datetime="2026-07-17 16:07:26+07:00">9h</time></td>
    <td class="cell-salary"><p>$48k - $60k</p></td>
  </tr>
  <tr data-jobid=151392 onclick="tableTurboRowClick(event, '/infra-engineer-zigchain/151392')" class="job-row-grid">
    <td>
      <h2> Infrastructure Engineer </h2>
      <h3> ZIGChain </h3>
      <span class=job-location-mobile><span class=job-loc-pin>*</span>Remote </span>
    </td>
    <td><time datetime="2026-07-16T10:00:00Z">1d</time></td>
    <td class="cell-salary"><p>$120k - $150k</p></td>
  </tr>
</tbody>
`;

test("parseWeb3CareerJobs extracts title, company, location, url", () => {
  const jobs = parseWeb3CareerJobs(SAMPLE_HTML);
  assert.equal(jobs.length, 2);

  assert.equal(jobs[0].externalId, "151471");
  assert.equal(jobs[0].title, "Junior Crypto Trader (Remote)");
  assert.equal(jobs[0].company, "Atom Partners");
  assert.equal(jobs[0].url, "https://web3.career/junior-crypto-trader-remote-atom-partners/151471");
  assert.equal(jobs[0].remote, true);
  assert.match(jobs[0].location, /Remote/i);
  assert.ok(jobs[0].jobIdentityKey);
});

test("parseWeb3CareerJobs returns empty for unrelated HTML", () => {
  assert.equal(parseWeb3CareerJobs("<html><body>no jobs</body></html>").length, 0);
});
