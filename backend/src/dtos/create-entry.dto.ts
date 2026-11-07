import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty, ArrayUnique, IsArray, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min,
} from 'class-validator';
import { DAYS, Day, ENTRY_TYPES, EntryType } from '../config/routine.config';

const tidy = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const tidyUpper = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toUpperCase() : value);

// What the browser must send to add a class. It may list several days at once.
export class CreateEntryDto {
  @Transform(tidyUpper)
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  courseCode: string;

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

  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsIn(DAYS, { each: true })
  days: Day[];

  @IsInt()
  @Min(0)
  @Max(1439)
  startMin: number;

  @IsInt()
  @Min(1)
  @Max(1440)
  endMin: number;
}