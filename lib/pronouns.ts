export type Pronoun = "he" | "she" | "they";

type Forms = {
  subj: string;
  obj: string;
  poss: string;
  is: string;
  has: string;
  needs: string;
  wishes: string;
  gets: string;
  hasnt: string;
};

// Singular "they" takes plural verb agreement ("they are/have/need"), not
// "they is/has/needs" — that's the one grammatical fork this needs to
// handle, everything else (he/she) shares the same singular forms.
const FORMS: Record<Pronoun, Forms> = {
  he: { subj: "he", obj: "him", poss: "his", is: "is", has: "has", needs: "needs", wishes: "wishes", gets: "gets", hasnt: "hasn't" },
  she: { subj: "she", obj: "her", poss: "her", is: "is", has: "has", needs: "needs", wishes: "wishes", gets: "gets", hasnt: "hasn't" },
  they: { subj: "they", obj: "them", poss: "their", is: "are", has: "have", needs: "need", wishes: "wish", gets: "get", hasnt: "haven't" },
};

// Fills a prompt template's {obj}/{subj}/{poss}/etc. tokens with the
// correct forms for the partner being referred to — defaults to "they"
// when a pronoun hasn't been set yet, rather than guessing he/she.
export function fillPronouns(template: string, pronoun: Pronoun | null): string {
  const forms = FORMS[pronoun ?? "they"];
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    return key in forms ? forms[key as keyof Forms] : match;
  });
}
