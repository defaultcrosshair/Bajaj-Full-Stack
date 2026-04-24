const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ── Identity ──────────────────────────────────────────────────────────────────
const USER_ID = 'Harshvardhan Singh Shekhawat_20/06/2005';
const EMAIL_ID = 'hs8199@srmist.edu.in';
const COLLEGE_ROLL_NUMBER = 'RA2311003011797';

// ── Validation ────────────────────────────────────────────────────────────────
const VALID_EDGE = /^[A-Z]->[A-Z]$/;

function classifyEntries(data) {
    const invalid_entries = [];
    const duplicate_edges = [];
    const seenEdges = new Set();
    const validEdges = []; // [{parent, child}]

    for (let raw of data) {
        const entry = raw.trim();

        // Self-loop check
        if (/^[A-Z]->[A-Z]$/.test(entry) && entry[0] === entry[3]) {
            invalid_entries.push(raw);
            continue;
        }

        if (!VALID_EDGE.test(entry)) {
            invalid_entries.push(raw);
            continue;
        }

        // Valid format
        if (seenEdges.has(entry)) {
            // Only push once to duplicate_edges even if seen many times
            if (!duplicate_edges.includes(entry)) duplicate_edges.push(entry);
        } else {
            seenEdges.add(entry);
            validEdges.push({ parent: entry[0], child: entry[3], raw: entry });
        }
    }

    return { validEdges, invalid_entries, duplicate_edges };
}

// ── Tree / Cycle building ─────────────────────────────────────────────────────
function buildHierarchies(validEdges) {
    // Track parent→children, and who has a parent (diamond: first parent wins)
    const children = {}; // node → [child, ...]
    const parentOf = {}; // node → parent (first-encountered wins)
    const allNodes = new Set();

    for (const { parent, child } of validEdges) {
        allNodes.add(parent);
        allNodes.add(child);

        if (!children[parent]) children[parent] = [];

        // Diamond: if child already has a parent, discard this edge silently
        if (parentOf[child] !== undefined) continue;

        parentOf[child] = parent;
        children[parent].push(child);
    }

    // Identify roots: nodes that never appear as a child
    const roots = [...allNodes].filter(n => parentOf[n] === undefined).sort();

    // Find connected groups via union-find
    const uf = {};
    function find(x) {
        if (!uf[x]) uf[x] = x;
        if (uf[x] !== x) uf[x] = find(uf[x]);
        return uf[x];
    }
    function union(a, b) {
        uf[find(a)] = find(b);
    }

    for (const { parent, child } of validEdges) union(parent, child);

    // Group nodes by component
    const groups = {};
    for (const n of allNodes) {
        const r = find(n);
        if (!groups[r]) groups[r] = new Set();
        groups[r].add(n);
    }

    const hierarchies = [];

    for (const [rep, groupSet] of Object.entries(groups)) {
        const groupNodes = [...groupSet];

        // Find root(s) in this group
        const groupRoots = groupNodes.filter(n => parentOf[n] === undefined).sort();

        // Cycle detection: DFS
        function hasCycle(start) {
            const visited = new Set();
            const stack = new Set();
            function dfs(node) {
                visited.add(node);
                stack.add(node);
                for (const ch of (children[node] || [])) {
                    if (!visited.has(ch)) {
                        if (dfs(ch)) return true;
                    } else if (stack.has(ch)) {
                        return true;
                    }
                }
                stack.delete(node);
                return false;
            }
            return dfs(start);
        }

        if (groupRoots.length === 0) {
            // Pure cycle — use lex smallest as root
            const cycleRoot = groupNodes.sort()[0];
            hierarchies.push({ root: cycleRoot, tree: {}, has_cycle: true });
            continue;
        }

        for (const root of groupRoots) {
            if (hasCycle(root)) {
                hierarchies.push({ root, tree: {}, has_cycle: true });
            } else {
                // Build nested tree
                function buildTree(node) {
                    const obj = {};
                    for (const ch of (children[node] || [])) {
                        obj[ch] = buildTree(ch);
                    }
                    return obj;
                }

                function calcDepth(node) {
                    const kids = children[node] || [];
                    if (kids.length === 0) return 1;
                    return 1 + Math.max(...kids.map(calcDepth));
                }

                const tree = { [root]: buildTree(root) };
                const depth = calcDepth(root);
                hierarchies.push({ root, tree, depth });
            }
        }
    }

    // Sort: non-cycles first (by root lex), cycles last
    hierarchies.sort((a, b) => {
        if (a.has_cycle && !b.has_cycle) return 1;
        if (!a.has_cycle && b.has_cycle) return -1;
        return a.root.localeCompare(b.root);
    });

    return hierarchies;
}

// ── Summary ───────────────────────────────────────────────────────────────────
function buildSummary(hierarchies) {
    const trees = hierarchies.filter(h => !h.has_cycle);
    const cycles = hierarchies.filter(h => h.has_cycle);

    let largest_tree_root = '';
    let maxDepth = -1;
    for (const t of trees) {
        if (t.depth > maxDepth || (t.depth === maxDepth && t.root < largest_tree_root)) {
            maxDepth = t.depth;
            largest_tree_root = t.root;
        }
    }

    return {
        total_trees: trees.length,
        total_cycles: cycles.length,
        largest_tree_root,
    };
}

// ── Route ─────────────────────────────────────────────────────────────────────
app.post('/bfhl', (req, res) => {
    try {
        const { data } = req.body;
        if (!Array.isArray(data)) {
            return res.status(400).json({ error: 'data must be an array of strings' });
        }

        const { validEdges, invalid_entries, duplicate_edges } = classifyEntries(data);
        const hierarchies = buildHierarchies(validEdges);
        const summary = buildSummary(hierarchies);

        res.json({
            user_id: USER_ID,
            email_id: EMAIL_ID,
            college_roll_number: COLLEGE_ROLL_NUMBER,
            hierarchies,
            invalid_entries,
            duplicate_edges,
            summary,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.use(express.static('public'));
app.get('/', (_, res) => res.sendFile(__dirname + '/public/index.html'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on port ${PORT}`));
