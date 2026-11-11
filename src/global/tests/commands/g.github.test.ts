import { issue } from '../../commands/g.issue';
import { mergePr, postPrRejectionComment } from '../../commands/g.prReview';

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  addLabels: vi.fn(),
  createComment: vi.fn(),
  merge: vi.fn(),
}));

vi.mock('octokit', () => ({
  Octokit: class {
    rest = {
      issues: { create: mocks.create, addLabels: mocks.addLabels, createComment: mocks.createComment },
      pulls: { merge: mocks.merge },
    };
  },
}));

describe('issue', () => {
  it('creates the issue then labels it', async () => {
    mocks.create.mockResolvedValueOnce({ data: { number: 5 } });
    mocks.addLabels.mockResolvedValueOnce({});
    const result = await issue('t', 'b', ['bug']);
    expect(result.data.number).toBe(5);
    expect(mocks.addLabels).toHaveBeenCalledWith(expect.objectContaining({ issue_number: 5, labels: ['bug'] }));
  });

  it('still resolves when labeling fails', async () => {
    mocks.create.mockResolvedValueOnce({ data: { number: 6 } });
    mocks.addLabels.mockRejectedValueOnce(new Error('label fail'));
    await expect(issue('t', 'b', ['bug'])).resolves.toBeDefined();
  });

  it('rejects when creation fails', async () => {
    mocks.create.mockRejectedValueOnce(new Error('create fail'));
    await expect(issue('t', 'b', [])).rejects.toThrow('create fail');
  });
});

describe('prReview', () => {
  it('posts a rejection comment attributed to the reviewer', async () => {
    mocks.createComment.mockResolvedValueOnce({});
    await postPrRejectionComment(3, 'Alice', 'nope');
    expect(mocks.createComment).toHaveBeenCalledWith(expect.objectContaining({
      issue_number: 3, body: '**Rejected by Alice:**\n\nnope',
    }));
  });

  it('rethrows comment failures', async () => {
    mocks.createComment.mockRejectedValueOnce(Object.assign(new Error('forbidden'), { status: 403 }));
    await expect(postPrRejectionComment(3, 'Alice', 'nope')).rejects.toThrow('forbidden');
  });

  it('squash merges', async () => {
    mocks.merge.mockResolvedValueOnce({});
    await mergePr(4, 'Bob');
    expect(mocks.merge).toHaveBeenCalledWith(expect.objectContaining({ pull_number: 4, merge_method: 'squash' }));
    mocks.merge.mockResolvedValueOnce({});
    await mergePr(4);
  });

  it('rethrows merge failures', async () => {
    mocks.merge.mockRejectedValueOnce('string failure');
    await expect(mergePr(4)).rejects.toBe('string failure');
  });
});
