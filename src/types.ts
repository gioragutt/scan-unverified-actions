export interface WorkflowSyntax {
  name?: string;
  on?: any;
  jobs: Record<
    string,
    {
      name?: string;
      steps: {
        name?: string;
        uses?: string;
        id?: string;
        run?: string;
      }[];
    }
  >;
}

export interface WorkflowFile {
  filename: string;
  content: WorkflowSyntax;
}
