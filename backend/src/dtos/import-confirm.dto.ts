import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsBoolean, IsOptional, ValidateNested } from 'class-validator';
import { CreateEntryDto } from './create-entry.dto';

// What the browser sends after the student checked the preview and pressed "Import".
export class ImportConfirmDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(40)
  @ValidateNested({ each: true })
  @Type(() => CreateEntryDto)
  classes: CreateEntryDto[];

  // true = delete my current routine for this semester first, then import
  @IsOptional()
  @IsBoolean()
  replace?: boolean;
}
