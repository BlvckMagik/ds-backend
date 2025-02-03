export class SendMessageDto {
  type: 'student' | 'teacher';
  name: string;
  number: string;
  subject:
    | 'Німецька мова'
    | 'Англійська мова'
    | 'Іспанська мова'
    | 'Математика';
  description?: string;
}
