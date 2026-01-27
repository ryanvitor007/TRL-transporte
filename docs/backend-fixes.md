# Correcoes Necessarias no Backend

## Problema Identificado

O `ValidationPipe` do NestJS com `whitelist: true` pode remover campos aninhados que nao estao explicitamente decorados. O DTO atual usa `@IsObject()` sem validar a estrutura interna.

---

## 1. Correcao no `create-journey.dto.ts`

Crie uma classe separada para o checklist e use `@ValidateNested()`:

```typescript
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsNumber,
  ValidateNested,
  IsBoolean,
} from 'class-validator';

// DTO para o checklist aninhado
export class ChecklistDto {
  @IsOptional()
  @IsObject()
  items?: Record<string, boolean>;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateJourneyDto {
  @IsInt({ message: 'O ID do motorista deve ser um número inteiro' })
  @IsNotEmpty({ message: 'O ID do motorista é obrigatório' })
  driverId: number;

  @IsInt({ message: 'O ID do veículo deve ser um número inteiro' })
  @IsNotEmpty({ message: 'O ID do veículo é obrigatório' })
  vehicleId: number;

  @IsString()
  @IsNotEmpty()
  startLocation: string;

  @IsNumber()
  @IsNotEmpty()
  startOdometer: number;

  // CORRECAO: Usa ValidateNested para garantir que o objeto aninhado seja preservado
  @IsOptional()
  @ValidateNested()
  @Type(() => ChecklistDto)
  checklist?: ChecklistDto;
}
```

---

## 2. Alternativa mais simples (se a correcao acima nao funcionar)

Desabilite o `whitelist` apenas para objetos aninhados no `main.ts`:

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: false,
    transform: true,
    // ADICIONE ESTA LINHA para preservar objetos aninhados
    transformOptions: {
      enableImplicitConversion: true,
    },
  }),
);
```

---

## 3. Debug no `journeys.service.ts`

Adicione logs para confirmar que os dados estao chegando:

```typescript
async create(createJourneyDto: CreateJourneyDto) {
  console.log('--- [DEBUG] DTO RECEBIDO NO SERVICE ---');
  console.log('driverId:', createJourneyDto.driverId);
  console.log('vehicleId:', createJourneyDto.vehicleId);
  console.log('checklist:', JSON.stringify(createJourneyDto.checklist, null, 2));
  console.log('checklist.items:', createJourneyDto.checklist?.items);
  
  // Verifica se items existe e tem dados
  const checklistItems = createJourneyDto.checklist?.items ?? {};
  console.log('checklistItems apos fallback:', JSON.stringify(checklistItems));
  
  const hasFailures = Object.keys(checklistItems).length > 0 && 
                      Object.values(checklistItems).some((val) => val === false);
  console.log('hasFailures:', hasFailures);
  
  // ... resto do codigo
}
```

---

## 4. Verificacao da Tabela `maintenances`

Confirme que a tabela possui todos os campos necessarios. O insert atual envia:

```typescript
{
  vehicle_id: number,
  driver_id: number,
  type: string,
  description: string,
  status: string,
  priority: string,
  created_at: string,
  checklist_data: object,
  cost: number,        // <-- Se este campo for NOT NULL no banco e faltar, o insert falha
  provider: string,    // <-- Se este campo for NOT NULL no banco e faltar, o insert falha
}
```

Execute este SQL para verificar a estrutura:

```sql
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'maintenances';
```

Se houver campos obrigatorios faltando, adicione-os no insert ou altere a tabela para permitir NULL.
