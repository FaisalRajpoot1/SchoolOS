import { PhotoPanel } from './PhotoPanel';
import { photosApi } from './photos.api';

/** Student profile photo panel — thin wrapper over the generic PhotoPanel. */
export function StudentPhotoPanel({
  studentId,
  name,
  initialHasPhoto,
}: {
  studentId: string;
  name: string;
  initialHasPhoto: boolean;
}) {
  return (
    <PhotoPanel
      src={photosApi.studentPhotoUrl(studentId)}
      name={name}
      initialHasPhoto={initialHasPhoto}
      upload={(file) => photosApi.uploadStudentPhoto(studentId, file)}
      remove={() => photosApi.deleteStudentPhoto(studentId)}
    />
  );
}
