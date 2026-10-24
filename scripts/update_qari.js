const fs = require('fs');
const path = 'd:/bimbel/components/MushafViewer.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Kurangi daftar qari jadi 3
const reciterOldPattern = /export const QURAN_RECITERS = \[[^\]]*\];/s;
const recitersNew = `export const QURAN_RECITERS = [
  { id: 'Hudhaify_128kbps', name: 'Ali Al-Hudhaify (Tartil Jelas)' },
];`;
// { id: 'Alafasy_128kbps', name: 'Misyari Rasyid Al-Afasy' },
// { id: 'Husary_128kbps', name: 'Mahmud Khalil Al-Husary (Tajwid)' },

if (reciterOldPattern.test(content)) {
  content = content.replace(reciterOldPattern, recitersNew);
}

// 2. Hubungkan selectedReciter ke play audio
content = content.replace(
  'audio.src = getAyahAudioUrl(verseKey);',
  'audio.src = getAyahAudioUrl(verseKey, selectedReciter);'
);

// 3. Tambahkan dropdown Qari di bar kontrol
const oldBar = `{/* Audio Murottal Bar */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleToggleSequence}
              className={\`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs \${
                playingVerseKey && isAutoPlayNext
                  ? "bg-rose-600 text-white"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }\`}
            >
              {playingVerseKey && isAutoPlayNext ? (
                <>
                  <Square size={12} fill="currentColor" /> Hentikan Murottal
                </>
              ) : (
                <>
                  <Volume2 size={13} /> Putar Murottal (Qari Al-Afasy)
                </>
              )}
            </button>`;

const newBar = `{/* Audio Murottal Bar & Dropdown Qari */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Qari:</span>
                <select
                  value={selectedReciter}
                  onChange={(e) => {
                    stopAudio();
                    setSelectedReciter(e.target.value);
                  }}
                  className="w-full max-w-[210px] px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white font-bold text-slate-700 outline-none focus:ring-1 focus:ring-emerald-500 truncate"
                >
                  {QURAN_RECITERS.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleToggleSequence}
                className={\`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs shrink-0 \${
                  playingVerseKey && isAutoPlayNext
                    ? "bg-rose-600 text-white"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }\`}
              >
                {playingVerseKey && isAutoPlayNext ? (
                  <>
                    <Square size={12} fill="currentColor" /> Berhenti
                  </>
                ) : (
                  <>
                    <Volume2 size={13} /> Putar Murottal
                  </>
                )}
              </button>
            </div>`;

content = content.replace(oldBar, newBar);

fs.writeFileSync(path, content, 'utf8');
console.log('UPDATE_SUCCESS');
