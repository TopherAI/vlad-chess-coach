import { useState } from "react";
import { Save, CheckCircle } from "lucide-react";

export function Profile() {
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: "Topher Bettis",
    username: "TopherBettis",
    email: "topherbettis7@gmail.com",
    goal: "Reach 2000 ELO",
    style: "Positional opening & attacking endgame",
    openingWhite: "Gentleman's Assassin (Italian/Giuoco Pianissimo)",
    openingBlack: "",
    notes: "",
  });

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">

      {/* Header */}
      <div className="border-b border-vlad-border pb-6">
        <div className="section-label mb-1.5">Settings</div>
        <h1 className="heading-lg">My Profile</h1>
      </div>

      <div className="grid grid-cols-12 gap-6">

        {/* Avatar + summary */}
        <div className="col-span-3">
          <div className="panel p-6 flex flex-col items-center text-center gap-4">
            <div className="w-20 h-20 rounded-full bg-vlad-surface2 border-2 border-vlad-border flex items-center justify-center font-display font-bold text-2xl text-vlad-text">
              TB
            </div>
            <div>
              <div className="font-display font-bold text-lg text-vlad-text">{form.name || "—"}</div>
              <div className="font-mono text-[10px] text-vlad-muted uppercase tracking-widest mt-1">
                {form.username || "—"}
              </div>
            </div>
            <div className="w-full border-t border-vlad-border/50 pt-4 space-y-2 text-left">
              <div>
                <div className="section-label mb-1">Goal</div>
                <div className="text-[12px] text-vlad-sub">{form.goal || "—"}</div>
              </div>
              <div>
                <div className="section-label mb-1">System</div>
                <div className="text-[12px] text-vlad-sub">Gentleman's Assassin</div>
              </div>
              <div>
                <div className="section-label mb-1">Current ELO</div>
                <div className="text-[12px] font-bold text-vlad-text font-mono">593</div>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="col-span-9">
          <form onSubmit={handleSave} className="panel p-7 space-y-5">

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={update("name")}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Chess.com Username</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={update("username")}
                  className="form-input"
                />
              </div>
            </div>

            <div>
              <label className="form-label">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={update("email")}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Primary Goal</label>
              <input
                type="text"
                value={form.goal}
                onChange={update("goal")}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Style of Play</label>
              <input
                type="text"
                value={form.style}
                onChange={update("style")}
                className="form-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="form-label">Preferred Opening (White)</label>
                <input
                  type="text"
                  value={form.openingWhite}
                  onChange={update("openingWhite")}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Preferred Opening (Black)</label>
                <input
                  type="text"
                  value={form.openingBlack}
                  onChange={update("openingBlack")}
                  placeholder="e.g. Sicilian, French, Caro-Kann..."
                  className="form-input"
                />
              </div>
            </div>

            <div>
              <label className="form-label">Personal Notes</label>
              <textarea
                value={form.notes}
                onChange={update("notes")}
                placeholder="Anything you want the coaches to know about your game, schedule, or goals..."
                rows={4}
                className="form-input resize-none leading-relaxed"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button type="submit" className="btn btn-primary px-6 py-3 text-sm gap-2">
                {saved ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Saved
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Profile
                  </>
                )}
              </button>
              {saved && (
                <span className="font-mono text-[11px] text-vlad-green animate-fade-in">
                  Profile updated successfully.
                </span>
              )}
            </div>

          </form>
        </div>

      </div>

    </div>
  );
}
