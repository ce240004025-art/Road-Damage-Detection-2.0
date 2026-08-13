import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  Plus,
  RefreshCw,
  Trophy,
  ImageIcon,
  MapPin,
  Award,
  Activity,
  Trash2,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

function Dashboard() {
  const [myReports, setMyReports] = useState([]);
  const [publicReports, setPublicReports] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [view, setView] = useState("my");
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  const navigate = useNavigate();
  const username = localStorage.getItem("username");

  // IMPORTANT:
  // This must be your currently deployed FastAPI backend.
  const API_URL =
    process.env.REACT_APP_API_URL ||
    "https://road-damage-detection-qcns.onrender.com";

  const fetchData = async () => {
    try {
      setLoading(true);

      const myRes = await fetch(
        `${API_URL}/myreports/${encodeURIComponent(username || "")}`
      );

      if (!myRes.ok) {
        throw new Error(`My reports request failed: ${myRes.status}`);
      }

      const myData = await myRes.json();

      const publicRes = await fetch(`${API_URL}/publicreports`);

      if (!publicRes.ok) {
        throw new Error(
          `Public reports request failed: ${publicRes.status}`
        );
      }

      const publicData = await publicRes.json();

      const leaderRes = await fetch(`${API_URL}/leaderboard`);

      if (!leaderRes.ok) {
        throw new Error(
          `Leaderboard request failed: ${leaderRes.status}`
        );
      }

      const leaderData = await leaderRes.json();

      setMyReports(Array.isArray(myData) ? myData : []);
      setPublicReports(Array.isArray(publicData) ? publicData : []);
      setLeaderboard(Array.isArray(leaderData) ? leaderData : []);
    } catch (error) {
      console.error("Dashboard fetch error:", error);

      setMyReports([]);
      setPublicReports([]);
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // We intentionally only want this to run once when Dashboard loads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getImageUrl = (path) => {
    if (!path) return "";

    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }

    const cleanPath = path.startsWith("/") ? path.substring(1) : path;

    return `${API_URL}/${cleanPath}`;
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/");
  };

  const handleDeleteReport = async (reportId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this record?"
    );

    if (!confirmed) return;

    try {
      const res = await fetch(`${API_URL}/reports/${reportId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchData();
      } else {
        alert("Failed to delete report.");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Error deleting report.");
    }
  };

  const totalScore = myReports.reduce(
    (total, report) => total + Number(report.points || 0),
    0
  );

  const reports = view === "my" ? myReports : publicReports;

  const getConfidenceClass = (confidence) => {
    const conf = Number(confidence || 0);

    if (conf > 0.7) return "badge-success";
    if (conf > 0.4) return "badge-warning";

    return "badge-danger";
  };

  const formatDamageType = (type) => {
    if (!type) return "Clear Road";

    const value = String(type).trim().toUpperCase();

    if (value === "D00") return "Longitudinal Crack";
    if (value === "D10") return "Transverse Crack";
    if (value === "D20") return "Alligator Crack";
    if (value === "D40") return "Pothole";

    if (value === "POTHOLE") return "Pothole";
    if (value === "CRACK") return "Crack";

    if (value === "NONE") return "Clear Road";
    if (value === "NO_DAMAGE") return "No Damage";
    if (value === "NO DAMAGE") return "No Damage";

    return type;
  };

  // ============================================================
  // PIE CHART DATA
  // ============================================================

  const calculateStats = (reportList) => {
    let pothole = 0;
    let crack = 0;
    let noDamage = 0;

    reportList.forEach((report) => {
      const type = String(report.damage_type || "")
        .trim()
        .toLowerCase();

      if (type === "pothole" || type === "d40") {
        pothole++;
      } else if (
        type === "crack" ||
        type === "d00" ||
        type === "d10" ||
        type === "d20"
      ) {
        crack++;
      } else if (
        type === "no_damage" ||
        type === "no damage" ||
        type === "none" ||
        type === "clear road"
      ) {
        noDamage++;
      }
    });

    return [
      {
        name: "Pothole",
        value: pothole,
        color: "#ef4444",
      },
      {
        name: "Crack",
        value: crack,
        color: "#eab308",
      },
      {
        name: "No Damage",
        value: noDamage,
        color: "#22c55e",
      },
    ].filter((item) => item.value > 0);
  };

  const pieData = calculateStats(reports);

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <>
      <div className="app-background"></div>

      <div className="page-container animate-fade-in">
        {/* NAVIGATION BAR */}
        <div
          className="glass-card"
          style={{
            padding: "20px 32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "32px",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "28px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <Activity
              color="var(--accent-primary)"
              size={32}
            />

            Road Damage

            <span
              style={{
                color: "var(--accent-primary)",
                marginLeft: "6px",
              }}
            >
              Scanner
            </span>
          </h1>

          <div
            style={{
              display: "flex",
              gap: "16px",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontWeight: "500",
                color: "var(--text-secondary)",
              }}
            >
              Hi,{" "}
              <span style={{ color: "white" }}>
                {username}
              </span>
            </span>

            <button
              className="btn btn-primary"
              onClick={() => navigate("/upload")}
            >
              <Plus size={18} />
              New Scan
            </button>

            <button
              className="btn btn-secondary"
              onClick={handleLogout}
              style={{ padding: "14px" }}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* MAIN GRID */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 3fr",
            gap: "32px",
          }}
        >
          {/* ====================================================
              LEFT SIDEBAR
          ==================================================== */}

          <div className="animate-fade-up delay-100">
            {/* TOTAL SCORE */}
            <div
              className="glass-card glass-card-compact hover-lift"
              style={{ marginBottom: "24px" }}
            >
              <h3
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px",
                  color: "var(--text-secondary)",
                  fontSize: "14px",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                <Award size={16} />
                My Total Score
              </h3>

              <div
                style={{
                  fontSize: "48px",
                  fontWeight: "800",
                  color: "var(--accent-primary)",
                }}
              >
                {totalScore}

                <span
                  style={{
                    fontSize: "18px",
                    color: "var(--text-secondary)",
                    fontWeight: "500",
                  }}
                >
                  {" "}
                  pts
                </span>
              </div>
            </div>

            {/* LEADERBOARD */}
            <div
              className="glass-card glass-card-compact hover-lift"
              style={{ marginBottom: "24px" }}
            >
              <h3
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "20px",
                  fontSize: "18px",
                }}
              >
                <Trophy
                  size={20}
                  color="var(--warning)"
                />
                Top Contributors
              </h3>

              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                }}
              >
                {leaderboard
                  .slice(0, 5)
                  .map((user, index) => (
                    <li
                      key={index}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "12px",
                        background:
                          "rgba(255,255,255,0.02)",
                        borderRadius: "12px",
                        marginBottom: "8px",
                        border:
                          "1px solid var(--glass-border)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "20px",
                          width: "32px",
                          textAlign: "center",
                          marginRight: "12px",
                        }}
                      >
                        {index === 0 ? (
                          "🥇"
                        ) : index === 1 ? (
                          "🥈"
                        ) : index === 2 ? (
                          "🥉"
                        ) : (
                          <span
                            style={{
                              fontSize: "14px",
                              color:
                                "var(--text-secondary)",
                            }}
                          >
                            #{index + 1}
                          </span>
                        )}
                      </div>

                      <div
                        style={{
                          flexGrow: 1,
                          fontWeight: "500",
                        }}
                      >
                        {user.username}
                      </div>

                      <div
                        style={{
                          fontWeight: "600",
                          color:
                            "var(--accent-primary)",
                        }}
                      >
                        {user.score}
                      </div>
                    </li>
                  ))}
              </ul>
            </div>

            {/* PIE CHART */}
            {pieData.length > 0 && (
              <div
                className="glass-card glass-card-compact hover-lift"
                style={{ marginBottom: "24px" }}
              >
                <h3
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "16px",
                    fontSize: "18px",
                  }}
                >
                  <Activity
                    size={20}
                    color="var(--accent-primary)"
                  />

                  {view === "my"
                    ? "Upload Statistics"
                    : "Global Statistics"}
                </h3>

                <div
                  style={{
                    width: "100%",
                    height: "250px",
                  }}
                >
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="42%"
                        outerRadius={75}
                        dataKey="value"
                        nameKey="name"
                      >
                        {pieData.map(
                          (entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color}
                            />
                          )
                        )}
                      </Pie>

                      <Tooltip
                        contentStyle={{
                          backgroundColor:
                            "rgba(0,0,0,0.9)",
                          border:
                            "1px solid var(--glass-border)",
                          borderRadius: "8px",
                        }}
                        itemStyle={{
                          color: "#fff",
                        }}
                      />

                      <Legend
                        wrapperStyle={{
                          paddingTop: "16px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* ====================================================
              RIGHT CONTENT
          ==================================================== */}

          <div className="animate-fade-up delay-200">
            <div
              className="glass-card"
              style={{ padding: "24px" }}
            >
              {/* TABS + REFRESH */}
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "center",
                  marginBottom: "32px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    background:
                      "rgba(0,0,0,0.3)",
                    padding: "6px",
                    borderRadius: "16px",
                    border:
                      "1px solid var(--glass-border)",
                  }}
                >
                  <button
                    className={`btn ${
                      view === "my"
                        ? "btn-primary"
                        : "btn-secondary"
                    }`}
                    style={{
                      padding: "10px 24px",
                      border: "none",
                      borderRadius: "12px",
                    }}
                    onClick={() => setView("my")}
                  >
                    My Uploads
                  </button>

                  <button
                    className={`btn ${
                      view === "public"
                        ? "btn-primary"
                        : "btn-secondary"
                    }`}
                    style={{
                      padding: "10px 24px",
                      border: "none",
                      borderRadius: "12px",
                    }}
                    onClick={() =>
                      setView("public")
                    }
                  >
                    Public Gallery
                  </button>
                </div>

                <button
                  className="btn btn-secondary"
                  onClick={fetchData}
                >
                  <RefreshCw size={16} />
                  Refresh
                </button>
              </div>

              {/* LOADING */}
              {loading ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "60px",
                    color:
                      "var(--text-secondary)",
                  }}
                >
                  <RefreshCw
                    className="pulse-circle"
                    size={32}
                    style={{
                      margin: "0 auto",
                      background:
                        "transparent",
                    }}
                  />

                  <p>
                    Syncing database...
                  </p>
                </div>
              ) : reports.length === 0 ? (
                /* NO REPORTS */
                <div
                  style={{
                    textAlign: "center",
                    padding: "80px 20px",
                    background:
                      "rgba(255,255,255,0.01)",
                    borderRadius: "16px",
                    border:
                      "1px dashed var(--glass-border)",
                  }}
                >
                  <ImageIcon
                    size={48}
                    color="var(--text-secondary)"
                    style={{
                      marginBottom: "16px",
                      opacity: 0.5,
                    }}
                  />

                  <h3
                    style={{
                      marginBottom: "8px",
                    }}
                  >
                    No uploads found
                  </h3>

                  <p
                    style={{
                      color:
                        "var(--text-secondary)",
                      marginBottom: "24px",
                    }}
                  >
                    {view === "my"
                      ? "You haven't uploaded any road damage photos yet."
                      : "No public uploads available."}
                  </p>

                  {view === "my" && (
                    <button
                      className="btn btn-primary"
                      onClick={() =>
                        navigate("/upload")
                      }
                    >
                      Start Uploading
                    </button>
                  )}
                </div>
              ) : (
                /* REPORT CARDS */
                <div className="masonry-grid">
                  {reports.map((report, index) => {
                    const imageUrl = getImageUrl(
                      report.image_path
                    );

                    return (
                      <div
                        key={
                          report.id || index
                        }
                        className={`glass-card glass-card-compact hover-lift animate-fade-up delay-${
                          ((index % 3) + 1) *
                          100
                        }`}
                      >
                        {/* IMAGE */}
                        {imageUrl && (
                          <img
                            src={imageUrl}
                            alt={
                              report.damage_type ||
                              "Road report"
                            }
                            className="report-image"
                            style={{
                              cursor:
                                "pointer",
                            }}
                            onClick={() =>
                              setSelectedImage(
                                imageUrl
                              )
                            }
                            onError={(event) => {
                              console.error(
                                "Image failed to load:",
                                imageUrl
                              );

                              event.currentTarget.style.display =
                                "none";
                            }}
                          />
                        )}

                        {/* REPORT INFORMATION */}
                        <div
                          style={{
                            marginBottom:
                              "16px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent:
                                "space-between",
                              alignItems:
                                "flex-start",
                              marginBottom:
                                "8px",
                            }}
                          >
                            <div
                              style={{
                                fontSize:
                                  "18px",
                                fontWeight:
                                  "600",
                                textTransform:
                                  "capitalize",
                              }}
                            >
                              {formatDamageType(
                                report.damage_type
                              )}
                            </div>

                            {view === "my" && (
                              <button
                                onClick={() =>
                                  handleDeleteReport(
                                    report.id
                                  )
                                }
                                style={{
                                  background:
                                    "transparent",
                                  border:
                                    "none",
                                  color:
                                    "var(--text-secondary)",
                                  cursor:
                                    "pointer",
                                  padding:
                                    "4px",
                                }}
                                title="Delete Record"
                              >
                                <Trash2
                                  size={16}
                                />
                              </button>
                            )}
                          </div>

                          <div
                            style={{
                              display: "flex",
                              justifyContent:
                                "space-between",
                              alignItems:
                                "center",
                            }}
                          >
                            <span
                              style={{
                                color:
                                  "var(--text-secondary)",
                                fontSize:
                                  "14px",
                              }}
                            >
                              by @
                              {
                                report.username
                              }
                            </span>

                            <span
                              className={`badge ${getConfidenceClass(
                                report.confidence
                              )}`}
                            >
                              {report.confidence
                                ? `${(
                                    Number(
                                      report.confidence
                                    ) *
                                    100
                                  ).toFixed(
                                    0
                                  )}% Match`
                                : "N/A"}
                            </span>
                          </div>
                        </div>

                        <hr
                          style={{
                            margin: "12px 0",
                          }}
                        />

                        {/* LOCATION + POINTS */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent:
                              "space-between",
                            alignItems:
                              "center",
                            fontSize: "14px",
                          }}
                        >
                          <span
                            style={{
                              display: "flex",
                              alignItems:
                                "center",
                              gap: "4px",
                              color:
                                "var(--text-secondary)",
                            }}
                          >
                            <MapPin
                              size={14}
                            />

                            {report.latitude &&
                            report.longitude ? (
                              <>
                                {`${parseFloat(
                                  report.latitude
                                ).toFixed(
                                  3
                                )}, ${parseFloat(
                                  report.longitude
                                ).toFixed(
                                  3
                                )}`}

                                <a
                                  href={`https://www.google.com/maps?q=${report.latitude},${report.longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    marginLeft:
                                      "6px",
                                    padding:
                                      "2px 6px",
                                    background:
                                      "var(--accent-primary)",
                                    color:
                                      "#fff",
                                    borderRadius:
                                      "4px",
                                    textDecoration:
                                      "none",
                                    fontSize:
                                      "12px",
                                    fontWeight:
                                      "500",
                                  }}
                                >
                                  View
                                </a>
                              </>
                            ) : (
                              "No GPS"
                            )}
                          </span>

                          {view === "my" && (
                            <span
                              style={{
                                fontWeight:
                                  "700",
                                color:
                                  "var(--accent-primary)",
                              }}
                            >
                              +
                              {
                                report.points
                              }{" "}
                              pts
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          FULLSCREEN IMAGE MODAL
      ======================================================== */}

      {selectedImage && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background:
              "rgba(0, 0, 0, 0.85)",
            backdropFilter:
              "blur(10px)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "40px",
          }}
          onClick={() =>
            setSelectedImage(null)
          }
        >
          <img
            src={selectedImage}
            alt="Preview"
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              borderRadius: "12px",
              boxShadow:
                "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            }}
            onClick={(event) =>
              event.stopPropagation()
            }
          />

          <button
            style={{
              position: "absolute",
              top: "24px",
              right: "24px",
              background:
                "rgba(255, 255, 255, 0.1)",
              border:
                "1px solid rgba(255, 255, 255, 0.2)",
              color: "white",
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              fontSize: "24px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent:
                "center",
            }}
            onClick={() =>
              setSelectedImage(null)
            }
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}

export default Dashboard;