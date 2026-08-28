import { type ReactElement } from "react";
import { Block } from "@/components/templates";
import { StackLayout } from "@/components/layouts";
import { EditableH2, EditableParagraph } from "@/components/atoms";
import { VisualOptionCards } from "@/components/organisms";

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
                Before we can count sevens, we need to know what we are counting out of.
                One die gives six outcomes. Two dice thrown together give more than most
                people first guess.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <Block key="layout-outcome-grid-visual" id="outcome-grid-visual">
        <VisualOptionCards
            blockId="outcome-grid-visual"
            cards={[
                {
                    id: "predict-outcome-count",
                    title: "Two dice above a block of squares students stretch to their guessed size",
                    looks: "Imagine two dice at the top of the screen and, beneath them, a small block of squares with a corner students can pull. The block grows square by square as they drag, and when they let go the true set of every possible roll fades in behind it.",
                    manipulate: "Stretch the block until it holds as many squares as they think two dice can produce, then release it against the real thing",
                    reveals: "Two dice give thirty-six outcomes, not twenty-one, because swapping which die shows which number is a different result",
                    targetsMisconception: "Students count (2,5) and (5,2) as the same outcome, so 21 outcomes not 36",
                    paradigm: "prediction",
                    recommended: true,
                },
                {
                    id: "build-grid-by-turning-dice",
                    title: "Two dice students turn by hand, filling in a six-by-six grid as they go",
                    looks: "Imagine two large dice that can be turned to any face, with a six-by-six grid of blank squares beside them. Every time the pair of faces changes, the one square matching that pair fills with colour and stays filled, so the grid slowly builds up.",
                    manipulate: "Turn each die to a chosen face and hunt for the squares they have not managed to fill yet",
                    reveals: "Each square stands for one pair of faces, and turning the dice the other way round fills a different square",
                    targetsMisconception: "Students count (2,5) and (5,2) as the same outcome, so 21 outcomes not 36",
                    paradigm: "constructivist",
                },
                {
                    id: "ordered-versus-merged-grids",
                    title: "A grid keeping the swapped rolls apart, beside one that merges them",
                    looks: "Imagine two grids side by side. The left one has a square for every pair of faces; the right one squashes each swapped pair into a single square, so it is visibly smaller. Marking a square in one grid lights up the square it corresponds to in the other.",
                    manipulate: "Drag a marker around the left grid and watch which square it lands on in the squashed grid",
                    reveals: "Merging the swapped rolls throws away real outcomes and leaves 21, which makes every probability after it wrong",
                    targetsMisconception: "Students count (2,5) and (5,2) as the same outcome, so 21 outcomes not 36",
                    paradigm: "comparison",
                    secondView: {
                        shows: "The same rolls with each swapped pair merged into one square, and a live count of squares",
                        role: "constraining",
                        syncedBy: "diceFirst and diceSecond, plus a shared hover highlight on the marked square",
                    },
                },
            ]}
        />
    </Block>,

    <StackLayout key="layout-outcome-grid-order-matters" maxWidth="xl">
        <Block id="outcome-grid-order-matters" padding="sm">
            <EditableParagraph id="para-outcome-grid-order-matters" blockId="outcome-grid-order-matters">
                The two dice are separate objects, so a 2 on the first with a 5 on the second
                is a genuinely different result from a 5 on the first with a 2 on the second.
                Both happen; they simply happen in different ways. Treating them as one is the
                quickest way to get every later answer wrong.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-outcome-grid-count" maxWidth="xl">
        <Block id="outcome-grid-count" padding="sm">
            <EditableParagraph id="para-outcome-grid-count" blockId="outcome-grid-count">
                Six choices for the first die and six for the second: thirty-six outcomes in
                all, every one of them equally likely.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
