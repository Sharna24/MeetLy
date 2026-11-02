import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

// Only these fields can be changed by the user. Anything else (role, email...) is dropped.
export class UpdateProfileDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  department: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  studentId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  bio?: string;
}
