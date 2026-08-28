import { type ReactElement } from "react";
import { Block } from "@/components/templates";
import { StackLayout } from "@/components/layouts";
import { EditableH2, EditableParagraph } from "@/components/atoms";
import { VisualOptionCards } from "@/components/organisms";

export const whySevenWinsBlocks: ReactElement[] = [
    <StackLayout key="layout-seven-wins-heading" maxWidth="xl">
        <Block id="seven-wins-heading" padding="md">
            <EditableH2 id="h2-seven-wins-heading" blockId="seven-wins-heading">
                Why Seven Wins
            </EditableH2>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-seven-wins-setup" maxWidth="xl">
        <Block id="seven-wins-setup" padding="sm">
            <EditableParagraph id="para-seven-wins-setup" blockId="seven-wins-setup">
                There are eleven possible totals, from two up to twelve. It is tempting to
                treat them as eleven equal options, the way the six faces of a single die are
                equal. They are not, and the gap between them is wider than you would expect.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <Block key="layout-seven-wins-visual" id="seven-wins-visual">
        <VisualOptionCards
            blockId="seven-wins-visual"
            cards={[
                {
                    id: "totals-grid-and-bars",
                    title: "The grid of every roll beside a set of bars, one for each total",
                    looks: "Imagine the grid of all the rolls on the left and, on the right, eleven bars labelled two to twelve. Touching a bar lights up the squares in the grid that make that total, and the bars are plainly uneven: they climb to a peak in the middle and fall away at both ends.",
                    manipulate: "Move along the bars from two to twelve and watch each total's squares light up in the grid",
                    reveals: "The totals are groups of different sizes, so seven has six squares behind it while two has only one",
                    targetsMisconception: "Students think every total from 2 to 12 is equally likely",
                    paradigm: "comparison",
                    recommended: true,
                    secondView: {
                        shows: "A bar for each total from 2 to 12, its height being the number of squares that produce it",
                        role: "complementary",
                        syncedBy: "chosenTotal, plus a shared hover highlight linking a bar to its diagonal of squares",
                    },
                },
                {
                    id: "predict-the-shape",
                    title: "Eleven empty columns labelled two to twelve, waiting to be given heights",
                    looks: "Imagine eleven blank columns standing side by side, one for each total, with nothing in them yet. Students draw a height on each column to show how often they expect that total, and once all eleven are set, the true heights fade in on top of their drawing.",
                    manipulate: "Drag the top of each column up or down to sketch how likely they think each total is, then reveal the real heights over it",
                    reveals: "The real shape is a triangle peaking at seven, not the flat line most people draw",
                    targetsMisconception: "Students think every total from 2 to 12 is equally likely",
                    paradigm: "prediction",
                },
                {
                    id: "sliding-diagonal",
                    title: "The grid of every roll with the squares for one chosen total lit as a stripe",
                    looks: "Imagine the grid of all the rolls with a row of totals from two to twelve running underneath it and a marker sitting on one of them. The lit squares always form a diagonal stripe across the grid, and the stripe stretches and shrinks as the marker slides along.",
                    manipulate: "Slide the marker along the row of totals and watch the stripe swell to its widest and then narrow again",
                    reveals: "The stripe is longest at seven with six squares, and shrinks to a single square at each end",
                    targetsMisconception: "Students think every total from 2 to 12 is equally likely",
                    paradigm: "temporal",
                },
            ]}
        />
    </Block>,

    <StackLayout key="layout-seven-wins-count" maxWidth="xl">
        <Block id="seven-wins-count" padding="sm">
            <EditableParagraph id="para-seven-wins-count" blockId="seven-wins-count">
                A total of two can happen in one way only: both dice show a one. A total of
                seven can happen in six different ways. That makes seven six times as likely as
                two, from the very same pair of dice.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-seven-wins-insight" maxWidth="xl">
        <Block id="seven-wins-insight" padding="sm">
            <EditableParagraph id="para-seven-wins-insight" blockId="seven-wins-insight">
                So totals are not outcomes. They are groups of outcomes, and the groups come in
                very different sizes.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
