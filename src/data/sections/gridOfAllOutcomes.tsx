import { useRef, useState, type ReactElement } from "react";
import { Block } from "@/components/templates";
import { StackLayout } from "@/components/layouts";
import {
    EditableH2,
    EditableParagraph,
    InlineClozeChoice,
    InlineClozeInput,
    InlineFeedback,
    InlineLinkedHighlight,
    InlineSpotColor,
    InteractionHintSequence,
} from "@/components/atoms";
import { Figure } from "@/components/molecules";
import { useVar, useSetVar } from "@/stores";
import { clamp, useSpring } from "@/lib/motion";
import {
    getVariableInfo,
    choicePropsFromDefinition,
    clozePropsFromDefinition,
    linkedHighlightPropsFromDefinition,
    spotColorPropsFromDefinition,
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

            {/* ── Left column: the two dice and the running readouts ── */}
            <g opacity={recede} style={ease}>
                <text x={62} y={92} fontSize={12} fill={INK_SOFT} textAnchor="middle">
                    First die
                </text>
                <text x={146} y={92} fontSize={12} fill={INK_SOFT} textAnchor="middle">
                    Second die
                </text>
                <Die x={32} y={100} size={60} value={firstFace} />
                <Die x={116} y={100} size={60} value={secondFace} />
                <text x={32} y={186} fontSize={12} fill={INK_SOFT}>
                    {revealed && hovered >= 0 ? "this square's roll" : "one possible roll"}
                </text>

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
                    <text x={GRID_LEFT + (FACES * STEP - (STEP - CELL)) / 2} y={48} fontSize={12} fill={INK_SOFT} textAnchor="middle">
                        Second die
                    </text>
                    <text
                        x={258}
                        y={GRID_TOP + (FACES * STEP - (STEP - CELL)) / 2}
                        fontSize={12}
                        fill={INK_SOFT}
                        textAnchor="middle"
                        transform={`rotate(-90 258 ${GRID_TOP + (FACES * STEP - (STEP - CELL)) / 2})`}
                    >
                        First die
                    </text>
                    {Array.from({ length: FACES }, (_, j) => (
                        <text key={`col-${j}`} x={cellX(j) + CELL / 2} y={68} fontSize={11} fill={INK_SOFT} textAnchor="middle">
                            {j + 1}
                        </text>
                    ))}
                    {Array.from({ length: FACES }, (_, i) => (
                        <text key={`row-${i}`} x={GRID_LEFT - 12} y={cellY(i) + CELL / 2 + 4} fontSize={11} fill={INK_SOFT} textAnchor="end">
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
            caption="Stretch the teal block by its corner to as many squares as you think two dice can make, then let go: the real set of outcomes appears behind your guess. Once it is showing, point at any square to see the roll that fills it."
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
                        label: "Drag this corner to size your guess",
                        position: { x: "72%", y: "40%" },
                        dragPath: { type: "line", startOffset: { x: -18, y: -12 }, endOffset: { x: 22, y: 16 } },
                    },
                ]}
            />
        </Figure>
    );
}

// ── Blocks ───────────────────────────────────────────────────────────────────

export const gridOfAllOutcomesBlocks: ReactElement[] = [
    <StackLayout key="layout-outcome-grid-heading" maxWidth="xl">
        <Block id="outcome-grid-heading" padding="md">
            <EditableH2 id="h2-outcome-grid-heading" blockId="outcome-grid-heading">
                The Grid of All Outcomes
            </EditableH2>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-outcome-grid-setup" maxWidth="xl">
        <Block id="outcome-grid-setup" padding="sm">
            <EditableParagraph id="para-outcome-grid-setup" blockId="outcome-grid-setup">
                One die gives six outcomes. Two dice together give more than most people first
                guess, so stretch the{" "}
                <InlineSpotColor varName="outcomeGuess" {...spotColorPropsFromDefinition(getVariableInfo('outcomeGuess'))}>
                    teal block of squares
                </InlineSpotColor>
                {" "}by its corner to the size you think is right, then let go and see the real
                set appear behind it.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-outcome-grid-visual" maxWidth="xl">
        <Block id="outcome-grid-visual" padding="sm" hasVisualization>
            <OutcomeGridFigure />
        </Block>
    </StackLayout>,

    <StackLayout key="layout-outcome-grid-order-matters" maxWidth="xl">
        <Block id="outcome-grid-order-matters" padding="sm">
            <EditableParagraph id="para-outcome-grid-order-matters" blockId="outcome-grid-order-matters">
                The two dice are separate objects, so{" "}
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
                Six choices for the first die and six for the second gives{" "}
                <InlineLinkedHighlight
                    varName="outcomeGridHighlight"
                    highlightId="all"
                    {...linkedHighlightPropsFromDefinition(getVariableInfo('outcomeGridHighlight'))}
                >
                    thirty-six outcomes
                </InlineLinkedHighlight>
                , every one equally likely. Merging the swapped rolls would leave only
                twenty-one, and every answer after that would be wrong.
            </EditableParagraph>
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
];
