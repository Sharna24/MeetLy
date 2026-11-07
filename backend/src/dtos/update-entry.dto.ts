import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { DAYS, Day, ENTRY_TYPES, EntryType } from '../config/routine.config';

const tidy = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const tidyUpper = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toUpperCase() : value);

// Editing one entry (one day). Every field is optional: send only what changed.
export class UpdateEntryDto {
  @IsOptional()
  @Transform(tidyUpper)
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  courseCode?: string;

  @IsOptional()
  @Transform(tidy)
  @IsString()
  @MaxLength(10)
  section?: string;

  @IsOptional()
  @Transform(tidyUpper)
  @IsString()
  @MaxLength(20)
  faculty?: string;

  @IsOptional()
  @Transform(tidyUpper)
  @IsString()
  @MaxLength(30)
  room?: string;

  @IsOptional()
  @IsIn(ENTRY_TYPES)
  type?: EntryType;

  @IsOptional()
  @IsIn(DAYS)
  dayOfWeek?: Day;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1439)
  startMin?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1440)
  endMin?: number;
}