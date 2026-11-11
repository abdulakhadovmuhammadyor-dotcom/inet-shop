import { NextResponse } from 'next/server';
import { ensureSchema, getPool, insertGame, query } from '@/lib/db';
import { Game } from '@/types';

interface GameRow {
  id: string;
  title: string;
  genre: string;
  release_year: number;
  cover_image: string;
  cpu_weight: number;
  gpu_weight: number;
  ram_min_gb: number;
  vram_min_gb: number;
  base_difficulty: number;
  optimal_fps_target: number;
}

function toGame(row: GameRow): Game {
  return {
    id: row.id,
    title: row.title,
    genre: row.genre,
    releaseYear: row.release_year,
    coverImage: row.cover_image,
    cpuWeight: row.cpu_weight,
    gpuWeight: row.gpu_weight,
    ramMinGB: row.ram_min_gb,
    vramMinGB: row.vram_min_gb,
    baseDifficulty: row.base_difficulty,
    optimalFpsTarget: row.optimal_fps_target,
  };
}

const SELECT_GAMES = `
  SELECT id, title, genre, release_year, cover_image, cpu_weight, gpu_weight,
         ram_min_gb, vram_min_gb, base_difficulty, optimal_fps_target
  FROM games
`;

export async function GET() {
  try {
    await ensureSchema();
    const rows = await query<GameRow>(`${SELECT_GAMES} ORDER BY created_at ASC, id ASC`);
    return NextResponse.json({ success: true, games: rows.map(toGame) });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureSchema();
    const game = (await req.json()) as Game;
    if (!game.id) {
      game.id = game.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
    }

    await insertGame(getPool(), game);

    const rows = await query<GameRow>(`${SELECT_GAMES} WHERE id = $1`, [game.id]);
    return NextResponse.json({ success: true, game: toGame(rows[0]) });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await ensureSchema();
    const game = (await req.json()) as Game;
    const rows = await query<GameRow>(
      `UPDATE games SET
         title = $2, genre = $3, release_year = $4, cover_image = $5,
         cpu_weight = $6, gpu_weight = $7, ram_min_gb = $8, vram_min_gb = $9,
         base_difficulty = $10, optimal_fps_target = $11
       WHERE id = $1
       RETURNING id, title, genre, release_year, cover_image, cpu_weight, gpu_weight,
                 ram_min_gb, vram_min_gb, base_difficulty, optimal_fps_target`,
      [
        game.id,
        game.title,
        game.genre,
        game.releaseYear,
        game.coverImage ?? '',
        game.cpuWeight,
        game.gpuWeight,
        game.ramMinGB,
        game.vramMinGB,
        game.baseDifficulty,
        game.optimalFpsTarget,
      ]
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Game not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, game: toGame(rows[0]) });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await ensureSchema();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, message: 'Missing game ID' }, { status: 400 });
    }

    const rows = await query<{ id: string }>('DELETE FROM games WHERE id = $1 RETURNING id', [id]);
    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Game not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}
