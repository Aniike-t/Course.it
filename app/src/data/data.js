// src/data/data.js

export const tracksData = [
  {
    id: 'chess-beginner',
    title: 'Beginner Chess Fundamentals',
    checkpoints: [
      // Checkpoints remain the same...
      {
        checkpointId: 1,
        title: 'The Board & Pieces',
        videoUrl: 'https://www.youtube.com/watch?v=OCSbzArwB10',
        description: 'Learn how to set up the chessboard correctly and identify each piece.',
        creatorName: 'Chess - Simplify',
        outcomes: ['Understand the layout of the chessboard (ranks, files).', 'Identify the name and starting position of each chess piece.', 'Be able to set up the board correctly for a game.'],
      },
      {
        checkpointId: 2,
        title: 'Pawn Movement',
        videoUrl: 'https://www.youtube.com/watch?v=YdnvlntAQH8',
        description: 'Covers how pawns move, including their initial two-step option and how they capture.',
        creatorName: 'Chess - Simplify',
        outcomes: ['Learn the standard forward movement of pawns.', "Understand the pawn's special first move.", 'Know how pawns capture diagonally.'],
      },
      {
        checkpointId: 3,
        title: 'Rook Movement',
        videoUrl: 'https://www.youtube.com/watch?v=H764YiYKV_g',
        description: 'Explains how the rook moves horizontally and vertically across the board.',
        creatorName: 'Chess.com',
        outcomes: ['Understand that rooks move in straight lines horizontally and vertically.', 'Recognize that rooks can move any number of unoccupied squares.', 'Learn how rooks capture opponent pieces.'],
      },
      {
        checkpointId: 4,
        title: 'Check & Checkmate Basics',
        videoUrl: 'https://www.youtube.com/watch?v=Ao9iOeK_jvU',
        description: 'Introduces the concepts of check (attacking the king) and checkmate (winning the game).',
        creatorName: 'Chess.com',
        outcomes: ['Define "check" and identify when a king is in check.', 'Understand the three ways to get out of check.', 'Define "checkmate" and recognize it as the goal of the game.'],
      },
      {
        checkpointId: 5,
        title: 'Castling',
        videoUrl: 'https://www.youtube.com/watch?v=TemLSMDKSMw',
        description: 'Explains the special move involving the king and rook, known as castling, and its conditions.',
        creatorName: 'Chess.com',
        outcomes: ['Learn the mechanics of kingside and queenside castling.', 'Understand the conditions required to be able to castle.', 'Recognize the strategic importance of castling for king safety.'],
      },
      {
        checkpointId: 6,
        title: 'Basic Opening Principles',
        videoUrl: 'https://www.youtube.com/watch?v=k6pE_jw-bJA',
        description: 'Introduces fundamental chess opening rules like controlling the center and developing pieces.',
        creatorName: 'GothamChess',
        outcomes: ['Understand the importance of controlling the center squares.', 'Learn why developing minor pieces (knights and bishops) early is crucial.', 'Recognize the significance of king safety (often via castling) in the opening.'],
      }
    ],
    // --- SAMPLE CHESS FLASHCARDS ---
    flashcards: [
      {
        question: "How many squares are on a standard chessboard?",
        answer: "64 (arranged in an 8x8 grid).",
        difficulty: "easy"
      },
      {
        question: "Which chess piece moves in an 'L' shape?",
        answer: "The Knight.",
        difficulty: "easy"
      },
      {
        question: "What is the special first move a pawn can make?",
        answer: "It can move forward two squares instead of one.",
        difficulty: "medium"
      },
      {
        question: "Can a king castle if it is currently in check?",
        answer: "No, a king cannot castle out of, through, or into check.",
        difficulty: "hard"
      },
      {
        question: "What does it mean to 'control the center' in chess?",
        answer: "Placing pieces (especially pawns and knights) in or attacking the central squares (d4, e4, d5, e5) to gain space and influence.",
        difficulty: "medium"
      }
    ],
  },
  {
    id: 'guitar-basics',
    title: 'Campfire Guitar Chords',
    checkpoints: [
      // Checkpoints remain the same...
      {
        checkpointId: 1,
        title: 'Parts of the Guitar & Tuning',
        videoUrl: 'https://www.youtube.com/watch?v=6FXV8DDUTHY',
        description: 'An overview of the different parts of an acoustic guitar and how to tune it to standard tuning (EADGBE).',
        creatorName: 'Andy Guitar',
        outcomes: ['Identify the main parts of an acoustic guitar (headstock, neck, body, etc.).', 'Know the standard tuning string names (EADGBE).', 'Understand the basic process of using a tuner.'],
      },
      {
        checkpointId: 2,
        title: 'Holding the Pick & First Strum',
        videoUrl: 'https://www.youtube.com/watch?v=ix9z6CLgc5w',
        description: 'Demonstrates the proper technique for holding a guitar pick and performing basic down strums.',
        creatorName: 'JustinGuitar',
        outcomes: ['Learn a common and effective way to hold a guitar pick.', 'Practice basic down-strumming technique.', 'Develop initial strumming rhythm.'],
      },
      {
        checkpointId: 3,
        title: 'The E Minor Chord',
        videoUrl: 'https://www.youtube.com/watch?v=sleGNaE63oI',
        description: 'Teaches how to play the E minor (Em) chord, often one of the first chords beginners learn.',
        creatorName: 'Marty Music',
        outcomes: ['Identify the correct finger placement for the E minor chord.', 'Practice pressing down the strings cleanly to avoid buzzing.', 'Be able to strum the E minor chord.'],
      },
      {
        checkpointId: 4,
        title: 'The C Major Chord',
        videoUrl: 'https://www.youtube.com/watch?v=oBVfrjVEsIo',
        description: 'Covers the finger placement for the C major chord and common challenges.',
        creatorName: 'GuitarLessons.com',
        outcomes: ['Learn the finger placement for the C major chord.', 'Understand which string is typically muted or avoided.', 'Practice transitioning to and from the C major chord.'],
      },
      {
        checkpointId: 5,
        title: 'The G Major Chord',
        videoUrl: 'https://www.youtube.com/watch?v=W5SsismhQOE',
        description: 'Teaches a common fingering for the G major chord.',
        creatorName: 'Andy Guitar',
        outcomes: ['Learn a standard finger placement for the G major chord.', 'Practice achieving a clear sound with all notes ringing.', 'Work on transitioning involving the G major chord.'],
      },
      {
        checkpointId: 6,
        title: 'Simple Chord Changes (Em -> C)',
        videoUrl: 'https://www.youtube.com/watch?v=gCvT7mwdf00',
        description: 'Focuses on techniques and exercises for smoothly transitioning between E minor and C major chords.',
        creatorName: 'JustinGuitar',
        outcomes: ['Understand the concept of anchor fingers (if applicable).', 'Practice minimizing finger movement during changes.', 'Develop muscle memory for the Em to C transition.'],
      },
      {
        checkpointId: 7,
        title: 'The D Major Chord',
        videoUrl: 'https://www.youtube.com/watch?v=DfYFI9Pl_7s',
        description: 'Teaches the finger placement for the D major chord, another essential beginner chord.',
        creatorName: 'JustinGuitar',
        outcomes: ['Learn the finger placement for the D major chord.', 'Practice forming the triangular shape cleanly.', 'Begin practicing transitions involving D major (e.g., G-C-D).'],
      },
      {
        checkpointId: 8,
        title: 'Basic Strumming Pattern (Down Down Up Up Down Up)',
        videoUrl: 'https://www.youtube.com/watch?v=zODRrt-b07s',
        description: 'Introduces a very common and versatile strumming pattern used in many songs.',
        creatorName: 'Andy Guitar',
        outcomes: ['Learn the rhythm and timing of the D DU UDU pattern.', 'Practice keeping a steady rhythm while strumming.', 'Apply the strumming pattern to the learned chords (Em, C, G, D).'],
      },
    ],
    // --- SAMPLE GUITAR FLASHCARDS ---
    flashcards: [
      {
        question: "What are the notes of standard guitar tuning, from lowest pitch (thickest string) to highest?",
        answer: "E - A - D - G - B - E",
        difficulty: "easy"
      },
      {
        question: "Which fingers typically fret the strings for an E minor (Em) chord?",
        answer: "The 2nd (middle) and 3rd (ring) fingers on the A and D strings at the 2nd fret.",
        difficulty: "easy"
      },
      {
        question: "What is a common strumming pattern often abbreviated as D DU UDU?",
        answer: "Down, Down Up, Up Down Up.",
        difficulty: "medium"
      },
      {
        question: "Which strings are usually played for a standard D Major chord?",
        answer: "The D, G, B, and high E strings (strings 4, 3, 2, 1). The A and low E strings are typically avoided.",
        difficulty: "medium"
      }
    ],
  },
  {
    id: 'poker-intro',
    title: 'Poker Hand Rankings',
    checkpoints: [
      // Checkpoints remain the same...
      {
        checkpointId: 1,
        title: 'What is Poker?',
        videoUrl: 'https://www.youtube.com/watch?v=89rrbdPzx8g',
        description: 'A brief introduction to the game of poker, focusing on Texas Hold\'em basics and objectives.',
        creatorName: 'PokerStars Learn',
        outcomes: ['Understand the basic goal of poker (making the best hand or making others fold).', "Get a general overview of Texas Hold'em.", 'Recognize poker as a game of skill and chance.'],
      },
      {
        checkpointId: 2,
        title: 'High Card & Pair',
        videoUrl: 'https://www.youtube.com/watch?v=wVVODJ323p0',
        description: 'Explains the lowest hand rankings: High Card and One Pair.',
        creatorName: 'Gripsed Poker',
        outcomes: ['Define the High Card hand ranking.', 'Define the One Pair hand ranking.', 'Be able to compare High Card and One Pair hands.'],
      },
      {
        checkpointId: 3,
        title: 'Two Pair & Three of a Kind',
        videoUrl: 'https://www.youtube.com/watch?v=Opa5FghuT_I',
        description: 'Covers the next hand rankings: Two Pair and Three of a Kind (Trips/Set).',
        creatorName: 'Gripsed Poker',
        outcomes: ['Define the Two Pair hand ranking.', 'Define the Three of a Kind hand ranking.', 'Understand that Three of a Kind beats Two Pair.'],
      },
      {
        checkpointId: 4,
        title: 'Straight & Flush',
        videoUrl: 'https://www.youtube.com/watch?v=JhhyaD1npbM',
        description: 'Explains the Straight (sequence) and Flush (same suit) hand rankings.',
        creatorName: 'Gripsed Poker',
        outcomes: ['Define a Straight (five cards in sequential rank).', 'Define a Flush (five cards of the same suit, not sequential).', 'Understand that a Flush beats a Straight.'],
      },
      {
        checkpointId: 5,
        title: 'Full House & Four of a Kind',
        videoUrl: 'https://www.youtube.com/watch?v=YVvgj_-ZqZI',
        description: 'Covers the powerful Full House (Three of a Kind + Pair) and Four of a Kind hands.',
        creatorName: 'Gripsed Poker',
        outcomes: ['Define a Full House.', 'Define Four of a Kind.', 'Understand that Four of a Kind beats a Full House.'],
      },
      {
        checkpointId: 6,
        title: 'Straight Flush & Royal Flush',
        videoUrl: 'https://www.youtube.com/watch?v=n-MG0gzXwis',
        description: 'Explains the top-tier hands: Straight Flush and the unbeatable Royal Flush.',
        creatorName: 'Gripsed Poker',
        outcomes: ['Define a Straight Flush (sequential cards of the same suit).', 'Define a Royal Flush (A-K-Q-J-10 of the same suit).', 'Memorize the complete hand ranking order.'],
      },
      {
        checkpointId: 7,
        title: 'Betting Rounds Explained (Pre-flop, Flop, Turn, River)',
        videoUrl: 'https://www.youtube.com/watch?v=Pwnig2Fq4-A',
        description: "Explains the sequence of betting actions in a standard Texas Hold'em hand.",
        creatorName: 'PokerStars Learn',
        outcomes: ['Identify the four main betting rounds: Pre-flop, Flop, Turn, and River.', 'Understand when community cards are dealt in relation to betting rounds.', 'Learn the basic options available during a betting round (check, bet, call, raise, fold).'],
      },
    ],
    // --- SAMPLE POKER FLASHCARDS ---
    flashcards: [
      {
        question: "What is the highest possible hand in standard poker?",
        answer: "A Royal Flush (Ace, King, Queen, Jack, Ten of the same suit).",
        difficulty: "easy"
      },
      {
        question: "Which hand is stronger: a Straight or a Flush?",
        answer: "A Flush (all cards of the same suit) beats a Straight (cards in sequence).",
        difficulty: "easy"
      },
      {
        question: "What combination of cards makes a Full House?",
        answer: "Three cards of one rank and two cards of another rank (e.g., 3 Aces and 2 Kings).",
        difficulty: "medium"
      },
      {
        question: "How many community cards are dealt on the 'Flop' in Texas Hold'em?",
        answer: "Three cards.",
        difficulty: "easy"
      },
      {
        question: "What are the four standard betting rounds in a Texas Hold'em hand?",
        answer: "Pre-flop, Flop, Turn, and River.",
        difficulty: "medium"
      }
    ],
  },
];