import { SubjectId } from '@server/database/models/SubjectId';
import { Read } from '@server/database/models/Read';

export type Revision = {
  subjectId: SubjectId;
  count: number;
  syncedAt: Date;
};

export type RevisionReads = {
  revision: Revision;
  readList: Read[];
};
