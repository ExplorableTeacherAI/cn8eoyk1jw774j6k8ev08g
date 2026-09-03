import { useEffect, useRef, useState, type ReactElement } from "react";
import { Block } from "@/components/templates";
import { StackLayout } from "@/components/layouts";
import {
    EditableH2,
    EditableParagraph,
    InlineClozeChoice,
    InlineClozeInput,
    InlineFeedback,
    InlineLinkedHighlight,
    InlineFormula,
    InlineSpotColor,
    InlineTooltip,
    InteractionHintSequence,
} from "@/components/atoms";
import { Figure, FormulaBlock } from "@/components/molecules";
import { useVar, useSetVar } from "@/stores";
import { clamp, useSpring } from "@/lib/motion";
import {
    getVariableInfo,
    choicePropsFromDefinition,
    clozePropsFromDefinition,
    linkedHighlightPropsFromDefinition,
    spotColorPropsFromDefinition,
    scrubVarsFromDefinitions,
} from "../variables";

// ── Domain model ─────────────────────────────────────────────────────────────

const FACES = 6;
const TRUE_OUTCOMES = FACES * FACES; // 36
const MAX_GUESS = 42;

/** Index of the square where the first die shows `a` and the second shows `b`. */
const squareIndex = (a: number, b: number) => (a - 1) * FACES + (b - 1);
const PAIR_TWO_FIVE = squareIndex(2, 5); // 10
const PAIR_FIVE_TWO = squareIndex(5, 2); // 25

// ── View geometry (every label budgeted inside the viewBox) ──────────────────

const VIEWBOX_WIDTH = 560;
const VIEWBOX_HEIGHT = 390;
const CELL = 36;
const STEP = 40;
const GRID_LEFT = 290;
const GRID_TOP = 78;

const cellX = (col: number) => GRID_LEFT + col * STEP;
const cellY = (row: number) => GRID_TOP + row * STEP;
const rowOf = (index: number) => Math.floor(index / FACES);
const colOf = (index: number) => index % FACES;

const INK = "#334155";
const INK_SOFT = "#64748B";
const RULE = "#CBD5E1";
const ACCENT = "#62D0AD";
const HIGHLIGHT = "#6366f1";
const FIRST_DIE = "#AC8BF9"; // soft violet — the first die, everywhere in the lesson
const SECOND_DIE = "#F7B23B"; // warm amber — the second die, everywhere in the lesson

const PIPS: Record<number, [number, number][]> = {
    1: [[0.5, 0.5]],
    2: [[0.28, 0.28], [0.72, 0.72]],
    3: [[0.28, 0.28], [0.5, 0.5], [0.72, 0.72]],
    4: [[0.28, 0.28], [0.72, 0.28], [0.28, 0.72], [0.72, 0.72]],
    5: [[0.28, 0.28], [0.72, 0.28], [0.5, 0.5], [0.28, 0.72], [0.72, 0.72]],
    6: [[0.28, 0.28], [0.72, 0.28], [0.28, 0.5], [0.72, 0.5], [0.28, 0.72], [0.72, 0.72]],
};

function Die({ x, y, size, value }: { x: number; y: number; size: number; value: number }) {
    return (
        <g>
            <rect
                x={x}
                y={y}
                width={size}
                height={size}
                rx={9}
                fill="#FFFFFF"
                stroke={INK_SOFT}
                strokeWidth={2}
                strokeLinejoin="round"
            />
            {(PIPS[value] ?? []).map(([fx, fy], i) => (
                <circle key={i} cx={x + fx * size} cy={y + fy * size} r={4.4} fill={INK} />
            ))}
        </g>
    );
}

// ── The figure ───────────────────────────────────────────────────────────────

function OutcomeGridDrawing() {
    const setVar = useSetVar();
    const guess = useVar<number>("outcomeGuess", 9);
    const storeRevealed = useVar<boolean>("outcomeGridRevealed", false);
    const hovered = useVar<number>("outcomeGridHovered", -1);
    const highlight = useVar<string>("outcomeGridHighlight", "");

    const [dragging, setDragging] = useState(false);
    const [handleHovered, setHandleHovered] = useState(false);
    const svgRef = useRef<SVGSVGElement>(null);

    // Pointing at a square from the prose also uncovers the grid, so a hover
    // never lands on something the reader cannot see.
    const revealed = storeRevealed || highlight !== "";

    const handleScale = useSpring(dragging || handleHovered ? 1.18 : 1, {
        stiffness: 400,
        damping: 26,
    });

    const firstFace = revealed && hovered >= 0 ? rowOf(hovered) + 1 : 2;
    const secondFace = revealed && hovered >= 0 ? colOf(hovered) + 1 : 5;

    const isTarget = (index: number) =>
        highlight === "all" ||
        (highlight === "pair-2-5" && index === PAIR_TWO_FIVE) ||
        (highlight === "pair-5-2" && index === PAIR_FIVE_TWO);

    // Everything not being pointed at recedes, so the target is the obvious change.
    const recede = highlight ? 0.35 : 1;
    const ease = { transition: "opacity 150ms ease-out" } as const;

    const pointerToCount = (clientX: number, clientY: number) => {
        const svg = svgRef.current;
        if (!svg) return guess;
        const rect = svg.getBoundingClientRect();
        const x = ((clientX - rect.left) / rect.width) * VIEWBOX_WIDTH;
        const y = ((clientY - rect.top) / rect.height) * VIEWBOX_HEIGHT;
        const col = clamp(Math.floor((x - GRID_LEFT) / STEP), 0, FACES - 1);
        const row = clamp(Math.floor((y - GRID_TOP) / STEP), 0, Math.ceil(MAX_GUESS / FACES) - 1);
        return clamp(row * FACES + col + 1, 1, MAX_GUESS);
    };

    const handleIndex = guess - 1;
    const handleX = cellX(colOf(handleIndex)) + CELL;
    const handleY = cellY(rowOf(handleIndex)) + CELL;

    const shortfall = TRUE_OUTCOMES - guess;

    return (
        <svg
            ref={svgRef}
            viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
            className="block w-full"
            role="img"
            aria-label="Two dice above a grid of every possible roll"
        >
            <defs>
                <filter id="outcome-handle-shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#0F172A" floodOpacity="0.25" />
                </filter>
            </defs>

            {/* ── Left column: the question, the two dice, the running readouts ── */}
            <g opacity={recede} style={ease}>
                <text x={32} y={40} fontSize={13} fill={INK}>
                    How many different rolls
                </text>
                <text x={32} y={58} fontSize={13} fill={INK}>
                    can two dice make?
                </text>
                <text x={62} y={92} fontSize={12} fill={FIRST_DIE} textAnchor="middle">
                    First die
                </text>
                <text x={146} y={92} fontSize={12} fill={SECOND_DIE} textAnchor="middle">
                    Second die
                </text>
                <Die x={32} y={100} size={60} value={firstFace} />
                <Die x={116} y={100} size={60} value={secondFace} />
                {revealed && hovered >= 0 ? (
                    <text x={32} y={188} fontSize={15} style={{ fontVariantNumeric: "tabular-nums" }}>
                        <tspan fill={INK_SOFT}>this square is </tspan>
                        <tspan fill={INK}>(</tspan>
                        <tspan fill={FIRST_DIE}>{firstFace}</tspan>
                        <tspan fill={INK}>, </tspan>
                        <tspan fill={SECOND_DIE}>{secondFace}</tspan>
                        <tspan fill={INK}>)</tspan>
                    </text>
                ) : (
                    <text x={32} y={188} fontSize={12} fill={INK_SOFT}>
                        {revealed ? "point at any square" : "one square = one roll like this"}
                    </text>
                )}

                <text
                    x={32}
                    y={216}
                    fontSize={13}
                    fill={ACCENT}
                    style={{ fontVariantNumeric: "tabular-nums" }}
                >
                    {`Your guess: ${guess} squares`}
                </text>
                {revealed ? (
                    <text
                        x={32}
                        y={238}
                        fontSize={13}
                        fill={INK}
                        style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                        {`All outcomes: ${TRUE_OUTCOMES} squares`}
                    </text>
                ) : (
                    <text x={32} y={238} fontSize={12} fill={INK_SOFT}>
                        Drag the corner, then let go
                    </text>
                )}
                {revealed && shortfall !== 0 && (
                    <text
                        x={32}
                        y={260}
                        fontSize={12}
                        fill={INK_SOFT}
                        style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                        {shortfall > 0 ? `You were ${shortfall} short` : `You were ${-shortfall} over`}
                    </text>
                )}
            </g>

            {/* ── The true set of 36 outcomes, uncovered on release ── */}
            <g opacity={revealed ? 1 : 0} style={{ transition: "opacity 320ms ease-out" }}>
                <g opacity={recede} style={ease}>
                    <text x={GRID_LEFT + (FACES * STEP - (STEP - CELL)) / 2} y={48} fontSize={12} fill={SECOND_DIE} textAnchor="middle">
                        Second die
                    </text>
                    <text
                        x={258}
                        y={GRID_TOP + (FACES * STEP - (STEP - CELL)) / 2}
                        fontSize={12}
                        fill={FIRST_DIE}
                        textAnchor="middle"
                        transform={`rotate(-90 258 ${GRID_TOP + (FACES * STEP - (STEP - CELL)) / 2})`}
                    >
                        First die
                    </text>
                    {Array.from({ length: FACES }, (_, j) => (
                        <text key={`col-${j}`} x={cellX(j) + CELL / 2} y={68} fontSize={11} fill={SECOND_DIE} textAnchor="middle">
                            {j + 1}
                        </text>
                    ))}
                    {Array.from({ length: FACES }, (_, i) => (
                        <text key={`row-${i}`} x={GRID_LEFT - 12} y={cellY(i) + CELL / 2 + 4} fontSize={11} fill={FIRST_DIE} textAnchor="end">
                            {i + 1}
                        </text>
                    ))}
                </g>

                {Array.from({ length: TRUE_OUTCOMES }, (_, index) => {
                    const target = isTarget(index);
                    // The two squares the prose points at light their phrase back.
                    const boundPhrase =
                        index === PAIR_TWO_FIVE ? "pair-2-5" : index === PAIR_FIVE_TWO ? "pair-5-2" : "";
                    const x = cellX(colOf(index));
                    const y = cellY(rowOf(index));
                    return (
                        <g
                            key={`true-${index}`}
                            opacity={highlight && !target ? 0.35 : 1}
                            style={ease}
                        >
                            {target && highlight !== "all" && (
                                <rect
                                    x={x - 3}
                                    y={y - 3}
                                    width={CELL + 6}
                                    height={CELL + 6}
                                    rx={7}
                                    fill="none"
                                    stroke={HIGHLIGHT}
                                    strokeWidth={7}
                                    opacity={0.28}
                                />
                            )}
                            <rect
                                x={x}
                                y={y}
                                width={CELL}
                                height={CELL}
                                rx={4}
                                fill="#FFFFFF"
                                stroke={target ? HIGHLIGHT : RULE}
                                strokeWidth={target ? 3 : 1.5}
                                style={{ transition: "stroke-width 150ms ease-out" }}
                            />
                            {revealed && (
                                <rect
                                    x={x}
                                    y={y}
                                    width={CELL}
                                    height={CELL}
                                    rx={4}
                                    fill="transparent"
                                    style={{ cursor: "pointer" }}
                                    onPointerEnter={() => {
                                        setVar("outcomeGridHovered", index);
                                        if (boundPhrase) setVar("outcomeGridHighlight", boundPhrase);
                                    }}
                                    onPointerLeave={() => {
                                        setVar("outcomeGridHovered", -1);
                                        if (boundPhrase) setVar("outcomeGridHighlight", "");
                                    }}
                                    onClick={() => setVar("outcomeGridHovered", index)}
                                />
                            )}
                        </g>
                    );
                })}
            </g>

            {/* ── The student's guessed block, drawn over the truth ── */}
            <g opacity={recede} style={ease}>
                {Array.from({ length: guess }, (_, index) => (
                    <rect
                        key={`guess-${index}`}
                        x={cellX(colOf(index))}
                        y={cellY(rowOf(index))}
                        width={CELL}
                        height={CELL}
                        rx={4}
                        fill={ACCENT}
                        fillOpacity={0.22}
                        stroke={ACCENT}
                        strokeWidth={1.5}
                    />
                ))}

                {/* the corner handle: the one grabbable thing on screen */}
                <g transform={`translate(${handleX} ${handleY}) scale(${handleScale})`}>
                    <circle r={11} fill={ACCENT} filter="url(#outcome-handle-shadow)" />
                    <path
                        d="M -4 1 L 4 1 M 1 -4 L 1 4"
                        stroke="#FFFFFF"
                        strokeWidth={1.8}
                        strokeLinecap="round"
                    />
                </g>
                <circle
                    cx={handleX}
                    cy={handleY}
                    r={24}
                    fill="transparent"
                    style={{ cursor: dragging ? "grabbing" : "grab", touchAction: "none" }}
                    onPointerDown={(event) => {
                        event.currentTarget.setPointerCapture(event.pointerId);
                        setDragging(true);
                    }}
                    onPointerMove={(event) => {
                        if (!dragging) return;
                        setVar("outcomeGuess", pointerToCount(event.clientX, event.clientY));
                    }}
                    onPointerUp={() => {
                        setDragging(false);
                        setVar("outcomeGridRevealed", true);
                    }}
                    onPointerEnter={() => setHandleHovered(true)}
                    onPointerLeave={() => setHandleHovered(false)}
                />
            </g>
        </svg>
    );
}

function OutcomeGridFigure() {
    const setVar = useSetVar();
    return (
        <Figure
            id="outcome-grid"
            caption="Every square stands for one roll of the two dice: the row says what the first die shows, the column what the second shows. Stretch the teal block by its corner until it holds as many squares as you think are possible, then let go and the true sample space appears behind your guess. Point at any square to read the roll it stands for as an ordered pair."
            onReset={() => {
                setVar("outcomeGuess", 9);
                setVar("outcomeGridRevealed", false);
                setVar("outcomeGridHovered", -1);
                setVar("outcomeGridHighlight", "");
            }}
        >
            <OutcomeGridDrawing />
            <InteractionHintSequence
                hintKey="outcome-grid-stretch"
                steps={[
                    {
                        gesture: "drag",
                        label: "Drag this corner to size your guess, then let go",
                        position: { x: "72%", y: "40%" },
                        dragPath: { type: "line", startOffset: { x: -18, y: -12 }, endOffset: { x: 22, y: 16 } },
                    },
                ]}
            />
        </Figure>
    );
}


// ── The tree of every roll ───────────────────────────────────────────────────

const TREE_WIDTH = 560;
const TREE_HEIGHT = 410;
const ROOT_RIGHT = 88;
const ROOT_Y = 191;
const FIRST_X = 200;
const FIRST_R = 19;
const SECOND_X = 380;
const SECOND_R = 17;
const OUTCOME_X = 426;
const HEADER_Y = 34;
const READOUT_Y = 384;

const rowY = (i: number) => 56 + i * 54;
const branchBit = (face: number) => 1 << (face - 1);
const countBits = (mask: number) => {
    let total = 0;
    for (let i = 0; i < FACES; i += 1) if (mask & (1 << i)) total += 1;
    return total;
};

function OutcomeTreeDrawing() {
    const setVar = useSetVar();
    const open = useVar<number>("treeOpenBranch", 1);
    const visited = useVar<number>("treeVisitedBranches", 1);

    const openRow = open - 1;
    const opened = countBits(visited);

    const openBranch = (face: number) => {
        setVar("treeOpenBranch", face);
        setVar("treeVisitedBranches", visited | branchBit(face));
    };

    return (
        <svg
            viewBox={`0 0 ${TREE_WIDTH} ${TREE_HEIGHT}`}
            className="block w-full"
            role="img"
            aria-label="A tree of every roll of two dice, with one first-die branch opened out"
        >
            <text x={FIRST_X} y={HEADER_Y} fontSize={12} fill={FIRST_DIE} textAnchor="middle">
                First die
            </text>
            <text x={SECOND_X} y={HEADER_Y} fontSize={12} fill={SECOND_DIE} textAnchor="middle">
                Second die
            </text>
            <text x={OUTCOME_X} y={HEADER_Y} fontSize={12} fill={INK_SOFT}>
                Outcome
            </text>

            {/* root */}
            <rect x={32} y={178} width={56} height={26} rx={8} fill="#FFFFFF" stroke={INK_SOFT} strokeWidth={1.5} />
            <text x={60} y={195} fontSize={12} fill={INK} textAnchor="middle">
                Roll
            </text>

            {/* root to each first-die face */}
            {Array.from({ length: FACES }, (_, i) => {
                const active = i === openRow;
                return (
                    <path
                        key={`stem-${i}`}
                        d={`M ${ROOT_RIGHT} ${ROOT_Y} C 140 ${ROOT_Y}, 148 ${rowY(i)}, ${FIRST_X - FIRST_R} ${rowY(i)}`}
                        fill="none"
                        stroke={active ? FIRST_DIE : RULE}
                        strokeWidth={active ? 3 : 1.5}
                        strokeLinecap="round"
                        style={{ transition: "stroke-width 150ms ease-out" }}
                    />
                );
            })}

            {/* the opened branch fanning out to its six second-die faces */}
            {Array.from({ length: FACES }, (_, j) => (
                <path
                    key={`fan-${j}`}
                    d={`M ${FIRST_X + FIRST_R} ${rowY(openRow)} C 290 ${rowY(openRow)}, 300 ${rowY(j)}, ${SECOND_X - SECOND_R} ${rowY(j)}`}
                    fill="none"
                    stroke={SECOND_DIE}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                />
            ))}

            {/* second-die faces and the outcome each path lands on */}
            {Array.from({ length: FACES }, (_, j) => (
                <g key={`leaf-${j}`}>
                    <circle cx={SECOND_X} cy={rowY(j)} r={SECOND_R} fill="#FFFFFF" stroke={SECOND_DIE} strokeWidth={2} />
                    <text
                        x={SECOND_X}
                        y={rowY(j) + 4}
                        fontSize={12}
                        fill={INK}
                        textAnchor="middle"
                        style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                        {j + 1}
                    </text>
                    <text
                        x={OUTCOME_X}
                        y={rowY(j) + 4}
                        fontSize={12}
                        fill={INK_SOFT}
                        style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                        {`(${open}, ${j + 1})`}
                    </text>
                </g>
            ))}

            {/* first-die faces: the one thing to click */}
            {Array.from({ length: FACES }, (_, i) => {
                const face = i + 1;
                const active = i === openRow;
                const seen = (visited & branchBit(face)) !== 0;
                return (
                    <g key={`first-${i}`} style={{ cursor: "pointer" }} onClick={() => openBranch(face)}>
                        <circle
                            cx={FIRST_X}
                            cy={rowY(i)}
                            r={FIRST_R}
                            fill={active || seen ? FIRST_DIE : "#FFFFFF"}
                            fillOpacity={active ? 0.28 : seen ? 0.12 : 1}
                            stroke={active || seen ? FIRST_DIE : RULE}
                            strokeWidth={active ? 3 : 1.5}
                            style={{ transition: "stroke-width 150ms ease-out" }}
                        />
                        <text
                            x={FIRST_X}
                            y={rowY(i) + 4}
                            fontSize={13}
                            fill={active || seen ? INK : INK_SOFT}
                            textAnchor="middle"
                            style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                            {face}
                        </text>
                        <circle cx={FIRST_X} cy={rowY(i)} r={26} fill="transparent" />
                    </g>
                );
            })}

            <text x={32} y={READOUT_Y} fontSize={12} fill={INK_SOFT} style={{ fontVariantNumeric: "tabular-nums" }}>
                {`Branches opened: ${opened} of ${FACES}`}
            </text>
            <text
                x={528}
                y={READOUT_Y}
                fontSize={12}
                fill={INK}
                textAnchor="end"
                style={{ fontVariantNumeric: "tabular-nums" }}
            >
                {`6 \u00d7 6 = ${TRUE_OUTCOMES} possible paths`}
            </text>
        </svg>
    );
}

function OutcomeTreeFigure() {
    const setVar = useSetVar();
    return (
        <Figure
            id="outcome-tree"
            caption="Click any first-die face to open its branch. Six second-die faces fan out from whichever one you pick, and the outcome each path lands on is written at the end of it."
            onReset={() => {
                setVar("treeOpenBranch", 1);
                setVar("treeVisitedBranches", 1);
            }}
        >
            <OutcomeTreeDrawing />
            <InteractionHintSequence
                hintKey="outcome-tree-open"
                steps={[
                    {
                        gesture: "click",
                        label: "Click a first-die face to open its branch",
                        position: { x: "36%", y: "27%" },
                    },
                ]}
            />
        </Figure>
    );
}

/** 6 x 6 = 36, coloured the way the grid is coloured, with 36 pointing back at it. */
function GridCountFormula() {
    return (
        <FormulaBlock
            latex="|S| = \clr{firstDie}{6} \times \clr{secondDie}{6} = \highlight{all}{36}"
            colorMap={{ firstDie: FIRST_DIE, secondDie: SECOND_DIE }}
            linkedHighlights={{
                all: {
                    varName: "outcomeGridHighlight",
                    color: HIGHLIGHT,
                    bgColor: "rgba(99, 102, 241, 0.15)",
                },
            }}
            color={INK}
        />
    );
}

/** The same rule, freed from dice: drag either count and the product follows. */
function CountingRuleFormula() {
    const first = useVar<number>("firstStageWays", 4);
    const second = useVar<number>("secondStageWays", 5);
    const setVar = useSetVar();

    useEffect(() => {
        setVar("stageOutcomes", first * second);
    }, [first, second, setVar]);

    return (
        <FormulaBlock
            latex={`|S| = \\textcolor{${FIRST_DIE}}{n_1} \\times \\textcolor{${SECOND_DIE}}{n_2} = \\scrub{firstStageWays} \\times \\scrub{secondStageWays} = \\val{stageOutcomes}`}
            variables={scrubVarsFromDefinitions(["firstStageWays", "secondStageWays", "stageOutcomes"])}
            color={INK}
        />
    );
}

// ── Blocks ───────────────────────────────────────────────────────────────────

export const gridOfAllOutcomesBlocks: ReactElement[] = [
    <StackLayout key="layout-outcome-grid-heading" maxWidth="xl">
        <Block id="outcome-grid-heading" padding="md">
            <EditableH2 id="h2-outcome-grid-heading" blockId="outcome-grid-heading">
                The Sample Space
            </EditableH2>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-outcome-grid-setup" maxWidth="xl">
        <Block id="outcome-grid-setup" padding="sm">
            <EditableParagraph id="para-outcome-grid-setup" blockId="outcome-grid-setup">
                One die gives six{" "}
                <InlineTooltip
                    id="tooltip-outcome-definition"
                    tooltip="An outcome is one complete result of the experiment: what the first die shows paired with what the second die shows."
                >
                    outcomes
                </InlineTooltip>
                . So how many can two dice give? Below, one square stands for one roll, so
                stretch the{" "}
                <InlineSpotColor varName="outcomeGuess" {...spotColorPropsFromDefinition(getVariableInfo('outcomeGuess'))}>
                    teal block
                </InlineSpotColor>
                {" "}by its corner until it holds as many squares as you think there are, then
                let go and the real answer appears behind your guess.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-outcome-grid-visual" maxWidth="xl">
        <Block id="outcome-grid-visual" padding="sm" hasVisualization>
            <OutcomeGridFigure />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-outcome-tree-visual" maxWidth="xl">
        <Block id="outcome-tree-visual" padding="sm" hasVisualization>
            <OutcomeTreeFigure />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-outcome-grid-order-matters" maxWidth="xl">
        <Block id="outcome-grid-order-matters" padding="sm">
            <EditableParagraph id="para-outcome-grid-order-matters" blockId="outcome-grid-order-matters">
                Point at any square and the dice show the roll it stands for, written as the
                ordered pair (first, second). The two dice are separate objects, so{" "}
                <InlineLinkedHighlight
                    varName="outcomeGridHighlight"
                    highlightId="pair-2-5"
                    {...linkedHighlightPropsFromDefinition(getVariableInfo('outcomeGridHighlight'))}
                >
                    a 2 on the first with a 5 on the second
                </InlineLinkedHighlight>
                {" "}is a genuinely different result from{" "}
                <InlineLinkedHighlight
                    varName="outcomeGridHighlight"
                    highlightId="pair-5-2"
                    {...linkedHighlightPropsFromDefinition(getVariableInfo('outcomeGridHighlight'))}
                >
                    a 5 on the first with a 2 on the second
                </InlineLinkedHighlight>
                . Both happen; they simply happen in different ways.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-outcome-grid-count" maxWidth="xl">
        <Block id="outcome-grid-count" padding="sm">
            <EditableParagraph id="para-outcome-grid-count" blockId="outcome-grid-count">
                Six choices for the{" "}
                <InlineSpotColor varName="firstDieTerm" {...spotColorPropsFromDefinition(getVariableInfo('firstDieTerm'))}>
                    first die
                </InlineSpotColor>
                {" "}and six for the{" "}
                <InlineSpotColor varName="secondDieTerm" {...spotColorPropsFromDefinition(getVariableInfo('secondDieTerm'))}>
                    second
                </InlineSpotColor>
                {" "}gives{" "}
                <InlineLinkedHighlight
                    varName="outcomeGridHighlight"
                    highlightId="all"
                    {...linkedHighlightPropsFromDefinition(getVariableInfo('outcomeGridHighlight'))}
                >
                    thirty-six ordered pairs
                </InlineLinkedHighlight>
                . The complete list of those pairs is the sample space S, so{" "}
                <InlineFormula latex="|S| = 36" colorMap={{}} />, and every outcome in S is
                equally likely. Merging the swapped rolls would leave only twenty-one.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-outcome-grid-count-formula" maxWidth="xl">
        <Block id="outcome-grid-count-formula" padding="lg">
            <GridCountFormula />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-outcome-grid-question-swapped" maxWidth="xl">
        <Block id="outcome-grid-question-swapped" padding="md">
            <EditableParagraph id="para-outcome-grid-question-swapped" blockId="outcome-grid-question-swapped">
                Now try a red die and a blue die. Getting red 3 with blue 6, and getting red 6
                with blue 3, are{" "}
                <InlineFeedback
                    varName="answerSwappedPair"
                    correctValue="different"
                    position="terminal"
                    successMessage="— right, and they sit in two separate squares, which is exactly why there are 36 outcomes and not 21"
                    failureMessage="— not quite."
                    hint="The dice are different colours, so you can always tell which one gave the 3"
                    reviewBlockId="outcome-grid-order-matters"
                    reviewLabel="Review swapped rolls"
                    visualizationHint={{
                        blockId: "outcome-grid-visual",
                        hintKey: "feedback-outcome-grid-swapped",
                        label: "Discover it yourself",
                        resetVars: {
                            outcomeGuess: 9,
                            outcomeGridRevealed: false,
                            outcomeGridHovered: -1,
                            outcomeGridHighlight: "",
                        },
                        steps: [
                            {
                                gesture: "drag",
                                label: "Drag the corner down to the very last square, then let go",
                                position: { x: "72%", y: "40%" },
                                completionVar: "outcomeGuess",
                                completionValue: 36,
                                completionTolerance: 3,
                            },
                            {
                                gesture: "click",
                                label: "Click the square for first die 2, second die 5",
                                position: { x: "78%", y: "35%" },
                                completionVar: "outcomeGridHovered",
                                completionValue: PAIR_TWO_FIVE,
                                completionTolerance: 0,
                            },
                            {
                                gesture: "click",
                                label: "Now first die 5, second die 2 — a different square entirely",
                                position: { x: "62%", y: "66%" },
                                completionVar: "outcomeGridHovered",
                                completionValue: PAIR_FIVE_TWO,
                                completionTolerance: 0,
                            },
                        ],
                    }}
                >
                    <InlineClozeChoice
                        varName="answerSwappedPair"
                        correctAnswer="different"
                        options={["the same", "different"]}
                        {...choicePropsFromDefinition(getVariableInfo('answerSwappedPair'))}
                    />
                </InlineFeedback>.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-outcome-grid-question-coin" maxWidth="xl">
        <Block id="outcome-grid-question-coin" padding="md">
            <EditableParagraph id="para-outcome-grid-question-coin" blockId="outcome-grid-question-coin">
                A coin is tossed and one die is rolled. Laid out the same way, the total number
                of possible outcomes is{" "}
                <InlineFeedback
                    varName="answerCoinAndDie"
                    correctValue={["12", "twelve"]}
                    position="terminal"
                    successMessage="— exactly, two ways for the coin paired with each of the die's six"
                    failureMessage="— close, but count again."
                    hint="Every one of the coin's two results can go with any of the die's six faces"
                    reviewBlockId="outcome-grid-count"
                    reviewLabel="Review the counting rule"
                >
                    <InlineClozeInput
                        varName="answerCoinAndDie"
                        correctAnswer={["12", "twelve"]}
                        {...clozePropsFromDefinition(getVariableInfo('answerCoinAndDie'))}
                    />
                </InlineFeedback>.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-outcome-grid-counting-rule" maxWidth="xl">
        <Block id="outcome-grid-counting-rule" padding="lg">
            <CountingRuleFormula />
        </Block>
    </StackLayout>,
];
